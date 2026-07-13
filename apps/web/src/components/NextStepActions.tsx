import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChatSessionMode } from '@nn-design/contracts';
import { useI18n } from '../i18n';
import { buildDefaultHiddenPrompt } from '../i18n/promptLanguage';
import type { Dict } from '../i18n/types';
import { useAnalytics } from '../analytics/provider';
import { trackNextStepActionClick } from '../analytics/events';
import { Icon, type IconName } from './Icon';
import {
  FEATURED_DESIGN_TOOLBOX_ACTION_IDS,
  designToolboxActionBadge,
  designToolboxActionDescription,
  designToolboxActionTitle,
  getDesignToolboxAction,
  type DesignToolboxActionId,
} from '../runtime/design-toolbox';
import type { SkillSummary } from '../types';
import styles from './NextStepActions.module.css';

type TranslateFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;
export type NextStepActionsVariant =
  | 'default'
  | 'project-incomplete'
  | 'design-system'
  | 'brand-extraction'
  | 'brand-extraction-incomplete'
  | 'brand-programmatic-incomplete'
  | 'brand-ai-incomplete'
  | 'plan';

export const DESIGN_SYSTEM_NEXT_STEP_ACTIONS = [
  {
    id: 'design-system-ai-refine',
    icon: 'sparkles' as IconName,
    titleKey: 'nextStep.designSystemAiRefineTitle' as keyof Dict,
    prompt:
      'Use AI extraction to refine this design system in place. Read the current DESIGN.md, brand.json, source context, tokens, typography, palette, assets, and component kit previews. Re-measure any linked website or source files when available, then update the same design system id without creating a duplicate. Focus on stronger token roles, brand voice, component guidance, light/dark kit quality, and reusable implementation notes. Finish by summarizing what changed and which files were updated.',
  },
  {
    id: 'design-system-audit-kit',
    icon: 'blocks' as IconName,
    titleKey: 'nextStep.designSystemAuditKitTitle' as keyof Dict,
    prompt:
      'Audit this design system for readiness. Check DESIGN.md, brand.json, variables.css, theme.json, kit.html, kit.dark.html, generated artifacts, palette contrast, typography specimens, spacing/radius rules, and component coverage. Fix the highest-impact issues directly, keep the same registered design system id, and report remaining gaps before publishing or using it in other projects.',
  },
] as const;

export const PROJECT_CONTINUE_PROMPT =
  '중단되었거나 완료되지 않은 작업을 이어서 진행하세요. 먼저 현재 대화, 프로젝트 파일, 화면에 보이는 오류를 확인한 뒤 다음으로 필요한 구체적인 작업을 실행하세요. 주요 결과물이 이미 있으면 같은 파일을 직접 업데이트하고, 없으면 누락된 주요 결과물을 생성하세요. 변경한 내용과 수정된 파일을 짧게 요약하세요.';

export const PROJECT_INCOMPLETE_NEXT_STEP_ACTIONS = [
  {
    id: 'project-continue',
    icon: 'refresh' as IconName,
    titleKey: 'nextStep.projectContinueTitle' as keyof Dict,
    prompt: PROJECT_CONTINUE_PROMPT,
  },
] as const;

export const BRAND_EXTRACTION_NEXT_STEP_ACTIONS = [
  {
    id: 'brand-ai-optimize',
    icon: 'sparkles' as IconName,
    titleKey: 'nextStep.brandAiOptimizeTitle' as keyof Dict,
    descriptionKey: 'nextStep.brandAiOptimizeBody' as keyof Dict,
    busyKey: 'brandEnrichment.busy' as keyof Dict,
  },
  {
    id: 'brand-create-design',
    icon: 'plus' as IconName,
    titleKey: 'nextStep.brandCreateDesignTitle' as keyof Dict,
    descriptionKey: 'nextStep.brandCreateDesignBody' as keyof Dict,
    busyKey: 'nextStep.createDesignBusy' as keyof Dict,
  },
] as const;

const PLAN_NEXT_STEP_ACTIONS = [
  {
    id: 'plan-generate-from-doc',
    icon: 'sparkles' as IconName,
    titleKey: 'nextStep.planGenerateTitle' as keyof Dict,
    descriptionKey: 'nextStep.planGenerateBody' as keyof Dict,
    promptKey: 'nextStep.planGeneratePrompt' as keyof Dict,
    sessionMode: 'design' as ChatSessionMode,
    requires: 'plan' as const,
  },
  {
    id: 'plan-improve-doc',
    icon: 'file' as IconName,
    titleKey: 'nextStep.planImproveTitle' as keyof Dict,
    descriptionKey: 'nextStep.planImproveBody' as keyof Dict,
    promptKey: 'nextStep.planImprovePrompt' as keyof Dict,
    sessionMode: 'plan' as ChatSessionMode,
    requires: 'plan' as const,
  },
  {
    id: 'plan-improve-artifact',
    icon: 'sparkles' as IconName,
    titleKey: 'nextStep.planImproveArtifactTitle' as keyof Dict,
    descriptionKey: 'nextStep.planImproveArtifactBody' as keyof Dict,
    promptKey: 'nextStep.planImproveArtifactPrompt' as keyof Dict,
    sessionMode: 'design' as ChatSessionMode,
    requires: 'artifact' as const,
  },
  {
    id: 'plan-merge-doc-artifact',
    icon: 'blocks' as IconName,
    titleKey: 'nextStep.planMergeTitle' as keyof Dict,
    descriptionKey: 'nextStep.planMergeBody' as keyof Dict,
    promptKey: 'nextStep.planMergePrompt' as keyof Dict,
    sessionMode: 'design' as ChatSessionMode,
    requires: 'both' as const,
  },
] as const;
const PLAN_GENERATE_ACTION = PLAN_NEXT_STEP_ACTIONS[0];
const PLAN_IMPROVE_DOC_ACTION = PLAN_NEXT_STEP_ACTIONS[1];
const PLAN_IMPROVE_ARTIFACT_ACTION = PLAN_NEXT_STEP_ACTIONS[2];
const PLAN_MERGE_DOC_ARTIFACT_ACTION = PLAN_NEXT_STEP_ACTIONS[3];

export const BRAND_CONTINUE_EXTRACTION_PROMPT =
  'Continue the programmatic design-system extraction from the saved draft. Re-open the source website and current brand files, inspect brand.html, brand.json, DESIGN.md, system assets, and any prefetched source files if present, then fill missing logo, palette, typography, imagery, and kit guidance progressively. Update the same design system id and do not create a duplicate.';

export const BRAND_EXTRACTION_INCOMPLETE_NEXT_STEP_ACTIONS = [
  {
    id: 'brand-continue-extraction',
    icon: 'sparkles' as IconName,
    titleKey: 'nextStep.brandContinueExtractionTitle' as keyof Dict,
    descriptionKey: 'nextStep.brandContinueExtractionBody' as keyof Dict,
    busyKey: 'nextStep.brandContinueExtractionBusy' as keyof Dict,
    prompt: BRAND_CONTINUE_EXTRACTION_PROMPT,
  },
  {
    id: 'brand-continue-ai-extraction',
    icon: 'sparkles' as IconName,
    titleKey: 'nextStep.brandContinueAiExtractionTitle' as keyof Dict,
    descriptionKey: 'nextStep.brandContinueAiExtractionProgrammaticBody' as keyof Dict,
    busyKey: 'nextStep.brandContinueAiExtractionBusy' as keyof Dict,
  },
] as const;

export const BRAND_AI_EXTRACTION_INCOMPLETE_NEXT_STEP_ACTIONS = [
  {
    id: 'brand-continue-ai-extraction',
    icon: 'sparkles' as IconName,
    titleKey: 'nextStep.brandContinueAiExtractionTitle' as keyof Dict,
    descriptionKey: 'nextStep.brandContinueAiExtractionAiBody' as keyof Dict,
    busyKey: 'nextStep.brandContinueAiExtractionBusy' as keyof Dict,
  },
] as const;

const ALL_BRAND_EXTRACTION_NEXT_STEP_ACTIONS = [
  ...BRAND_EXTRACTION_NEXT_STEP_ACTIONS,
  ...BRAND_EXTRACTION_INCOMPLETE_NEXT_STEP_ACTIONS,
  ...BRAND_AI_EXTRACTION_INCOMPLETE_NEXT_STEP_ACTIONS,
] as const;

interface Props {
  // The previewable artifact this affordance is anchored to. Passed back to
  // share/download so the parent can act on the right file.
  fileName?: string | null;
  // Plan-mode actions need both sides of the handoff when available: the
  // editable Markdown plan and the generated artifact it should govern.
  planFileName?: string | null;
  artifactFileName?: string | null;
  // Open the file's existing Share/Export menu in the preview workspace.
  onShare?: (fileName: string) => void;
  // Download the previewable artifact.
  onDownload?: (fileName: string) => void;
  // Seed the composer with a featured design-toolbox action (matched skill +
  // prompt). Does NOT auto-send — the composer draft waits for the user.
  onToolboxAction?: (id: DesignToolboxActionId) => void;
  // Seed the composer with a custom prompt. Used for design-system projects,
  // where the primary next steps are system optimization rather than generic
  // artifact polishing.
  onPromptAction?: (
    prompt: string,
    options?: { sessionMode?: ChatSessionMode; hiddenPrompt?: string },
  ) => void;
  // Run the deeper AI extraction pass for a programmatically-created brand
  // design system.
  onAiOptimize?: () => void;
  aiOptimizeBusy?: boolean;
  // Restart the deterministic programmatic pass for an incomplete brand
  // extraction, reusing the same brand/project/design-system.
  onContinueExtraction?: () => void;
  continueExtractionBusy?: boolean;
  // Resume the selected agent on an incomplete brand extraction scaffold.
  onContinueAiExtraction?: () => void;
  continueAiExtractionBusy?: boolean;
  // Create a new design using the active brand/design system.
  onCreateDesign?: () => void;
  createDesignBusy?: boolean;
  // Legacy parent props retained for compatibility; the More menu that used
  // these actions is intentionally no longer rendered from Next step.
  onCreateDesignSystem?: () => void;
  createDesignSystemBusy?: boolean;
  // Seed the composer with a specific global skill resource picked from the toolbox.
  onPickSkill?: (skillId: string) => void;
  // Available global skill resources retained for caller compatibility.
  skills?: SkillSummary[];
  // Resolved `@skill` names per featured action, shown in the hover detail.
  toolboxSkillNames?: Partial<Record<DesignToolboxActionId, string | null>>;
  // Contribute the artifact to the Design For AIR community gallery.
  onShareToOpenDesign?: () => void;
  shareToOpenDesignBusy?: boolean;
  variant?: NextStepActionsVariant;
}

const FLYOUT_GAP = 8;
const VIEWPORT_MARGIN = 8;
const DETAIL_WIDTH = 240;
// Conservative heights used to keep a flyout on-screen vertically (over-estimating
// only shifts it further up, which is always safe).
const DETAIL_HEIGHT = 180;
// Give users enough time to cross the small gap between flyout levels without
// making dismissal feel sticky once the pointer leaves the whole affordance.
const FLYOUT_CLOSE_DELAY_MS = 240;

// Place a flyout next to an anchor rect: flip to the left when the right edge
// would overflow, and clamp vertically so a tall flyout under a row near the
// bottom of the viewport keeps its bottom edge on-screen. Returns viewport-fixed
// coordinates.
function place(
  anchor: DOMRect,
  width: number,
  height: number,
): { left: number; top: number } {
  const toRight = anchor.right + FLYOUT_GAP;
  const left =
    toRight + width > window.innerWidth - VIEWPORT_MARGIN
      ? anchor.left - FLYOUT_GAP - width
      : toRight;
  const maxTop = window.innerHeight - VIEWPORT_MARGIN - height;
  const top = Math.max(VIEWPORT_MARGIN, Math.min(anchor.top, maxTop));
  return { left: Math.max(VIEWPORT_MARGIN, left), top };
}

type Anchor = { left: number; top: number };
type BrandExtractionAction = (typeof ALL_BRAND_EXTRACTION_NEXT_STEP_ACTIONS)[number];
type BrandExtractionActionId = BrandExtractionAction['id'];
type PlanAction = (typeof PLAN_NEXT_STEP_ACTIONS)[number];
type PromptNextStepAction =
  | (typeof DESIGN_SYSTEM_NEXT_STEP_ACTIONS)[number]
  | (typeof PROJECT_INCOMPLETE_NEXT_STEP_ACTIONS)[number];
type Detail =
  | ({ kind: 'toolbox'; id: DesignToolboxActionId } & Anchor)
  | ({ kind: 'brand'; id: BrandExtractionActionId } & Anchor);

function isPlanFileName(fileName: string | null | undefined): boolean {
  return !!fileName && /\.mdx?$/i.test(fileName);
}

function isArtifactFileName(fileName: string | null | undefined): boolean {
  return !!fileName && /\.html?$/i.test(fileName);
}

function brandActionTitle(action: BrandExtractionAction, t: TranslateFn, busy: boolean): string {
  if ('busyKey' in action && busy) return t(action.busyKey);
  return t(action.titleKey);
}

function brandActionDescription(action: BrandExtractionAction, t: TranslateFn): string {
  return t(action.descriptionKey);
}

function promptActionTitle(action: PromptNextStepAction, t: TranslateFn): string {
  return t(action.titleKey);
}

function promptActionPrompt(action: PromptNextStepAction, locale: string): string {
  if (locale !== 'zh-CN') return action.prompt;
  switch (action.id) {
    case 'project-continue':
      return PROJECT_CONTINUE_PROMPT;
    case 'design-system-ai-refine':
      return 'AI 추출을 사용해 이 디자인 시스템을 제자리에서 계속 개선하세요. 현재 DESIGN.md, brand.json, source context, tokens, 타이포그래피, 팔레트, 에셋, 컴포넌트 키트 미리보기를 읽고, 연결된 웹사이트나 소스 파일이 있으면 다시 측정하세요. 같은 디자인 시스템 id를 유지하고 중복 시스템을 만들지 마세요. 토큰 역할, 브랜드 보이스, 컴포넌트 가이드, 라이트/다크 키트 품질, 재사용 가능한 구현 메모를 강화하세요. 마지막에는 변경 사항과 업데이트한 파일을 요약하세요.';
    case 'design-system-audit-kit':
      return '이 디자인 시스템의 사용 준비 상태를 점검하세요. DESIGN.md, brand.json, variables.css, theme.json, kit.html, kit.dark.html, 생성 산출물, 색상 대비, 타이포그래피 샘플, 간격/라운드 규칙, 컴포넌트 커버리지를 확인하세요. 영향도가 가장 큰 문제는 직접 수정하고, 같은 등록 디자인 시스템 id를 유지하며, 배포 또는 다른 프로젝트 적용 전에 남은 gaps를 보고하세요.';
    default:
      return (action as PromptNextStepAction).prompt;
  }
}

export function NextStepActions({
  fileName,
  planFileName,
  artifactFileName,
  onToolboxAction,
  onPromptAction,
  onAiOptimize,
  aiOptimizeBusy = false,
  onContinueExtraction,
  continueExtractionBusy = false,
  onContinueAiExtraction,
  continueAiExtractionBusy = false,
  onCreateDesign,
  createDesignBusy = false,
  toolboxSkillNames,
  variant = 'default',
}: Props) {
  const { t, locale } = useI18n();
  const analytics = useAnalytics();
  const exposedRef = useRef(false);
  useEffect(() => {
    if (exposedRef.current) return;
    exposedRef.current = true;
    trackNextStepActionClick(analytics.track, {
      page_name: 'chat_panel',
      area: 'next_step',
      element: 'next_step_exposed',
    });
  }, [analytics.track]);

  // The featured rows still use a small detail tooltip, portaled to <body> so
  // the narrow chat column never clips it.
  const [detail, setDetail] = useState<Detail | null>(null);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);
  const closeAll = useCallback(() => {
    setDetail(null);
  }, []);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      closeAll();
      closeTimer.current = null;
    }, FLYOUT_CLOSE_DELAY_MS);
  }, [cancelClose, closeAll]);
  useEffect(() => () => cancelClose(), [cancelClose]);

  const openDetail = useCallback(
    (id: DesignToolboxActionId, rect: DOMRect) => {
      cancelClose();
      setDetail({ kind: 'toolbox', id, ...place(rect, DETAIL_WIDTH, DETAIL_HEIGHT) });
    },
    [cancelClose],
  );
  const openBrandDetail = useCallback(
    (id: BrandExtractionActionId, rect: DOMRect) => {
      cancelClose();
      setDetail({ kind: 'brand', id, ...place(rect, DETAIL_WIDTH, DETAIL_HEIGHT) });
    },
    [cancelClose],
  );

  const track = useCallback(
    (element: 'toolbox_action', chipId?: string) => {
      trackNextStepActionClick(analytics.track, {
        page_name: 'chat_panel',
        area: 'next_step',
        element,
        ...(chipId ? { chip_id: chipId } : {}),
      });
    },
    [analytics.track],
  );

  const handleToolboxAction = useCallback(
    (id: DesignToolboxActionId) => {
      track('toolbox_action', id);
      onToolboxAction?.(id);
      closeAll();
    },
    [closeAll, onToolboxAction, track],
  );
  const handlePromptAction = useCallback(
    (action: PromptNextStepAction) => {
      track('toolbox_action', action.id);
      onPromptAction?.(promptActionPrompt(action, locale), {
        hiddenPrompt: buildDefaultHiddenPrompt(locale),
      });
      closeAll();
    },
    [closeAll, locale, onPromptAction, track],
  );
  const resolvedPlanFileName =
    planFileName ?? (variant === 'plan' && isPlanFileName(fileName) ? fileName : null);
  const resolvedArtifactFileName =
    artifactFileName ?? (variant === 'plan' && isArtifactFileName(fileName) ? fileName : null);
  const handlePlanPromptAction = useCallback(
    (action: PlanAction) => {
      if (action.requires === 'plan' && !resolvedPlanFileName) return;
      if (action.requires === 'artifact' && !resolvedArtifactFileName) return;
      if (action.requires === 'both' && (!resolvedPlanFileName || !resolvedArtifactFileName)) return;
      const primaryFile =
        action.requires === 'artifact'
          ? resolvedArtifactFileName
          : resolvedPlanFileName ?? resolvedArtifactFileName;
      if (!primaryFile) return;
      track('toolbox_action', action.id);
      const prompt = t(action.promptKey, {
        file: primaryFile,
        document: resolvedPlanFileName ?? primaryFile,
        artifact: resolvedArtifactFileName ?? primaryFile,
      });
      onPromptAction?.(
        prompt,
        {
          sessionMode: action.sessionMode,
          hiddenPrompt: buildDefaultHiddenPrompt(locale),
        },
      );
      closeAll();
    },
    [closeAll, locale, onPromptAction, resolvedArtifactFileName, resolvedPlanFileName, t, track],
  );

  const handleAiOptimize = useCallback(() => {
    if (aiOptimizeBusy) return;
    track('toolbox_action', 'brand-ai-optimize');
    onAiOptimize?.();
    closeAll();
  }, [aiOptimizeBusy, closeAll, onAiOptimize, track]);

  const handleCreateDesign = useCallback(() => {
    if (createDesignBusy) return;
    track('toolbox_action', 'brand-create-design');
    onCreateDesign?.();
    closeAll();
  }, [closeAll, createDesignBusy, onCreateDesign, track]);

  const handleContinueAiExtraction = useCallback(() => {
    if (continueAiExtractionBusy) return;
    track('toolbox_action', 'brand-continue-ai-extraction');
    onContinueAiExtraction?.();
    closeAll();
  }, [closeAll, continueAiExtractionBusy, onContinueAiExtraction, track]);

  const handleBrandAction = useCallback(
    (action: BrandExtractionAction) => {
      if (action.id === 'brand-continue-extraction') {
        if (continueExtractionBusy) return;
        track('toolbox_action', action.id);
        onContinueExtraction?.();
        closeAll();
        return;
      }
      if (action.id === 'brand-continue-ai-extraction') {
        handleContinueAiExtraction();
        return;
      }
      if (action.id === 'brand-ai-optimize') {
        handleAiOptimize();
        return;
      }
      handleCreateDesign();
    },
    [
      closeAll,
      continueExtractionBusy,
      handleContinueAiExtraction,
      handleAiOptimize,
      handleCreateDesign,
      onContinueExtraction,
      track,
    ],
  );

  const visiblePlanActions = useMemo(() => {
    if (resolvedPlanFileName && resolvedArtifactFileName) {
      return [PLAN_MERGE_DOC_ARTIFACT_ACTION, PLAN_IMPROVE_ARTIFACT_ACTION];
    }
    if (resolvedPlanFileName) {
      return [PLAN_GENERATE_ACTION, PLAN_IMPROVE_DOC_ACTION];
    }
    if (resolvedArtifactFileName) {
      return [PLAN_IMPROVE_ARTIFACT_ACTION];
    }
    return [];
  }, [resolvedArtifactFileName, resolvedPlanFileName]);

  const showToolbox = !!onToolboxAction;
  const showPlanRows = variant === 'plan' && visiblePlanActions.length > 0 && !!onPromptAction;
  const showProjectIncompleteRows = variant === 'project-incomplete' && !!onPromptAction;
  const showDesignSystemRows = variant === 'design-system' && !!onPromptAction;
  const brandActions =
    variant === 'brand-ai-incomplete'
      ? BRAND_AI_EXTRACTION_INCOMPLETE_NEXT_STEP_ACTIONS
      : variant === 'brand-extraction-incomplete' || variant === 'brand-programmatic-incomplete'
        ? BRAND_EXTRACTION_INCOMPLETE_NEXT_STEP_ACTIONS
        : BRAND_EXTRACTION_NEXT_STEP_ACTIONS;
  const showBrandRows =
    (
      variant === 'brand-extraction' ||
      variant === 'brand-extraction-incomplete' ||
      variant === 'brand-programmatic-incomplete' ||
      variant === 'brand-ai-incomplete'
    ) &&
    (
      variant === 'brand-extraction-incomplete' || variant === 'brand-programmatic-incomplete'
        ? !!onContinueExtraction || !!onContinueAiExtraction
        : variant === 'brand-ai-incomplete'
          ? !!onContinueAiExtraction
        : !!onAiOptimize || !!onCreateDesign
    );

  // Hover handlers shared by the detail tooltip: stay open while hovered.
  const keepOpen = { onMouseEnter: cancelClose, onMouseLeave: scheduleClose };

  return (
    <div className={styles.root} data-testid="next-step-actions">
      <div className={styles.label}>{t('nextStep.title')}</div>
      {showBrandRows || showPlanRows || showProjectIncompleteRows || showDesignSystemRows || showToolbox ? (
        <div className={styles.toolboxList} data-testid="next-step-toolbox">
          {showPlanRows
            ? visiblePlanActions.map((action) => {
                const title = t(action.titleKey);
                const description = t(action.descriptionKey);
                return (
                  <button
                    key={action.id}
                    type="button"
                    className={styles.toolboxRow}
                    data-testid={`next-step-plan-action-${action.id}`}
                    aria-label={`${title}. ${description}`}
                    title={description}
                    onClick={() => handlePlanPromptAction(action)}
                  >
                    <Icon name={action.icon} size={14} className={styles.toolboxRowIcon} />
                    <span className={styles.toolboxRowText}>
                      <span className={styles.toolboxRowTitle}>{title}</span>
                      <span className={styles.toolboxRowDescription}>{description}</span>
                    </span>
                    <Icon name="chevron-right" size={13} className={styles.toolboxRowArrow} />
                  </button>
                );
              })
            : null}
          {showBrandRows
            ? brandActions.map((action) => {
                const busy =
                  (action.id === 'brand-continue-extraction' && continueExtractionBusy) ||
                  (action.id === 'brand-continue-ai-extraction' && continueAiExtractionBusy) ||
                  (action.id === 'brand-ai-optimize' && aiOptimizeBusy) ||
                  (action.id === 'brand-create-design' && createDesignBusy);
                const unavailable =
                  (action.id === 'brand-continue-extraction' && !onContinueExtraction) ||
                  (action.id === 'brand-continue-ai-extraction' && !onContinueAiExtraction) ||
                  (action.id === 'brand-ai-optimize' && !onAiOptimize) ||
                  (action.id === 'brand-create-design' && !onCreateDesign);
                if (unavailable) return null;
                const title = brandActionTitle(action, t, busy);
                const description = brandActionDescription(action, t);
                return (
                  <button
                    key={action.id}
                    type="button"
                    className={styles.toolboxRow}
                    data-testid={`next-step-brand-action-${action.id}`}
                    aria-busy={busy || undefined}
                    aria-label={`${title}. ${description}`}
                    disabled={busy}
                    title={description}
                    onClick={() => handleBrandAction(action)}
                    onMouseEnter={(e) => openBrandDetail(action.id, e.currentTarget.getBoundingClientRect())}
                    onMouseLeave={scheduleClose}
                  >
                    <Icon
                      name={busy ? 'spinner' : action.icon}
                      size={14}
                      className={busy ? 'icon-spin' : styles.toolboxRowIcon}
                    />
                    <span className={styles.toolboxRowText}>
                      <span className={styles.toolboxRowTitle}>{title}</span>
                      <span className={styles.toolboxRowDescription}>{description}</span>
                    </span>
                    <Icon name="chevron-right" size={13} className={styles.toolboxRowArrow} />
                  </button>
                );
              })
            : null}
          {showProjectIncompleteRows
            ? PROJECT_INCOMPLETE_NEXT_STEP_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={styles.toolboxRow}
                  data-testid={`next-step-project-action-${action.id}`}
                  onClick={() => handlePromptAction(action)}
                >
                  <Icon name={action.icon} size={14} className={styles.toolboxRowIcon} />
                  <span className={styles.toolboxRowTitle}>{promptActionTitle(action, t)}</span>
                  <Icon name="chevron-right" size={13} className={styles.toolboxRowArrow} />
                </button>
              ))
            : null}
          {showDesignSystemRows
            ? DESIGN_SYSTEM_NEXT_STEP_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={styles.toolboxRow}
                  data-testid={`next-step-design-system-action-${action.id}`}
                  onClick={() => handlePromptAction(action)}
                >
                  <Icon name={action.icon} size={14} className={styles.toolboxRowIcon} />
                  <span className={styles.toolboxRowTitle}>{promptActionTitle(action, t)}</span>
                  <Icon name="chevron-right" size={13} className={styles.toolboxRowArrow} />
                </button>
              ))
            : null}
          {showToolbox && !showDesignSystemRows
            && !showProjectIncompleteRows
            && !showBrandRows
            && !showPlanRows
            ? FEATURED_DESIGN_TOOLBOX_ACTION_IDS.map((id) => {
                const action = getDesignToolboxAction(id);
                if (!action) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className={styles.toolboxRow}
                    data-testid={`next-step-toolbox-action-${id}`}
                    onClick={() => handleToolboxAction(id)}
                    onMouseEnter={(e) => openDetail(id, e.currentTarget.getBoundingClientRect())}
                    onMouseLeave={scheduleClose}
                  >
                    <Icon name={action.icon} size={14} className={styles.toolboxRowIcon} />
                    <span className={styles.toolboxRowTitle}>
                      {designToolboxActionTitle(action, t)}
                    </span>
                    <Icon name="chevron-right" size={13} className={styles.toolboxRowArrow} />
                  </button>
                );
              })
            : null}
        </div>
      ) : null}

      {/* Level: featured-row detail card */}
      {detail && typeof document !== 'undefined'
        ? createPortal(
            (() => {
              if (detail.kind === 'brand') {
                const action = brandActions.find((item) => item.id === detail.id);
                if (!action) return null;
                return (
                  <div
                    className={styles.detail}
                    role="tooltip"
                    style={{ left: detail.left, top: detail.top }}
                    {...keepOpen}
                  >
                    <div className={styles.detailTitle}>{brandActionTitle(action, t, false)}</div>
                    <div className={styles.detailDesc}>{brandActionDescription(action, t)}</div>
                  </div>
                );
              }
              const action = getDesignToolboxAction(detail.id);
              if (!action) return null;
              const skillName = toolboxSkillNames?.[detail.id] ?? null;
              return (
                <div
                  className={styles.detail}
                  role="tooltip"
                  style={{ left: detail.left, top: detail.top }}
                  {...keepOpen}
                >
                  <div className={styles.detailTitle}>{designToolboxActionTitle(action, t)}</div>
                  <div className={styles.detailDesc}>
                    {designToolboxActionDescription(action, t)}
                  </div>
                  {skillName ? <div className={styles.detailSkill}>@{skillName}</div> : null}
                  <div className={styles.detailBadge}>{designToolboxActionBadge(action, t)}</div>
                </div>
              );
            })(),
            document.body,
          )
        : null}

    </div>
  );
}
