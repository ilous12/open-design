// Plan §3.F5 / spec §11.6 — Home plugin details inspector.
//
// This file used to render a single inspector body for every plugin
// kind. The home gallery now ships type-aware preview tiles
// (image / video / HTML / design-system / fallback), and the user
// expects the detail modal to mirror those tiles with the same
// affordances they get on the curated gallery (DesignSystemPreview
// modal, examples PreviewModal, PromptTemplatePreviewModal):
//
//   media   → image/video player, prompt body, copy, lightbox
//   html    → sandboxed iframe + share menu + fullscreen
//   design  → showcase / tokens tabs + DESIGN.md sidebar
//   text    → original rich inspector (scenario fallback)
//
// We dispatch on `inferPluginPreview` (the same classifier the home
// card uses) so the chrome users see when expanding a tile is the
// natural extension of the tile they clicked. The Use/Apply flow
// stays identical — every variant reaches `usePlugin` through the
// same callback wiring.

import type { InstalledPluginRecord } from '@nn-design/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n';
import { inferPluginPreview } from './plugins-home/preview';
import { PluginScenarioDetail } from './plugin-details/PluginScenarioDetail';
import { PluginExampleDetail } from './plugin-details/PluginExampleDetail';
import { PluginDesignSystemDetail } from './plugin-details/PluginDesignSystemDetail';
import { PluginMediaDetail } from './plugin-details/PluginMediaDetail';
import type { PluginUseAction } from './plugins-home/useActions';
import type { PreviewSharePopoverItem } from './PreviewModal';
import { PreviewModal } from './PreviewModal';
import {
  homeReferenceCloneUrl,
  homeReferenceSlugFromPluginId,
  isHomeReferencePlugin,
} from './home-reference-plugins';
import { localizePluginDescription, localizePluginTitle } from './plugins-home/localization';

interface Props {
  record: InstalledPluginRecord;
  onClose: () => void;
  onUse: (record: InstalledPluginRecord, action: PluginUseAction) => void;
  onDuplicate?: (record: InstalledPluginRecord) => void;
  isApplying?: boolean;
  hideUseAction?: boolean;
  // Analytics — fires when the user picks an item inside the PreviewModal
  // share popover (media / html / design variants only; the scenario
  // fallback has no share popover).
  onSharePopoverItemClick?: (item: PreviewSharePopoverItem) => void;
}

export function PluginDetailsModal({
  record,
  onClose,
  onUse,
  onDuplicate,
  isApplying,
  hideUseAction,
  onSharePopoverItemClick,
}: Props) {
  if (isHomeReferencePlugin(record)) {
    return (
      <ReferencePluginDetail
        record={record}
        onClose={onClose}
        onUse={onUse}
        onDuplicate={onDuplicate}
        isApplying={isApplying}
        hideUseAction={hideUseAction}
        onSharePopoverItemClick={onSharePopoverItemClick}
      />
    );
  }

  const preview = inferPluginPreview(record);
  let detail: JSX.Element;

  if (preview.kind === 'media') {
    detail = (
      <PluginMediaDetail
        record={record}
        onClose={onClose}
        onUse={onUse}
        onDuplicate={onDuplicate}
        isApplying={isApplying}
        hideUseAction={hideUseAction}
        onSharePopoverItemClick={onSharePopoverItemClick}
      />
    );
  } else if (preview.kind === 'html') {
    detail = (
      <PluginExampleDetail
        record={record}
        exampleStem={
          preview.source === 'example' ? preview.exampleStem ?? null : null
        }
        onClose={onClose}
        onUse={onUse}
        onDuplicate={onDuplicate}
        isApplying={isApplying}
        hideUseAction={hideUseAction}
        onSharePopoverItemClick={onSharePopoverItemClick}
      />
    );
  } else if (preview.kind === 'design') {
    detail = (
      <PluginDesignSystemDetail
        record={record}
        onClose={onClose}
        onUse={onUse}
        onDuplicate={onDuplicate}
        isApplying={isApplying}
        hideUseAction={hideUseAction}
        onSharePopoverItemClick={onSharePopoverItemClick}
      />
    );
  } else {
    detail = (
      <PluginScenarioDetail
        record={record}
        onClose={onClose}
        onUse={onUse}
        onDuplicate={onDuplicate}
        isApplying={isApplying}
        hideUseAction={hideUseAction}
      />
    );
  }

  if (typeof document === 'undefined') return detail;
  return createPortal(detail, document.body);
}

function ReferencePluginDetail({
  record,
  onClose,
  onUse,
  onDuplicate,
  isApplying,
  hideUseAction,
}: Props) {
  const { locale, t } = useI18n();
  const localizedTitle = localizePluginTitle(locale, record);
  const description = localizePluginDescription(locale, record);
  const slug = homeReferenceSlugFromPluginId(record.id);
  const cloneUrl = slug ? homeReferenceCloneUrl(slug) : null;
  const [html, setHtml] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (!cloneUrl || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setHtml(null);
      setError(null);
      const resp = await fetch(cloneUrl, { cache: 'no-store' });
      if (!resp.ok) {
        setError(`HTTP ${resp.status}`);
        setHtml(undefined);
        return;
      }
      const body = await resp.text();
      setHtml(withReferenceBaseHref(body, cloneUrl));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'network error';
      setError(message);
      setHtml(undefined);
    } finally {
      inFlightRef.current = false;
    }
  }, [cloneUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const onView = useCallback(() => {
    void load();
  }, [load]);

  const detail = (
    <PreviewModal
      title={localizedTitle}
      subtitle={description || undefined}
      views={[
        {
          id: 'preview',
          label: t('examples.previewLabel'),
          html,
          error,
        },
      ]}
      onView={onView}
      exportTitleFor={() => localizedTitle}
      onClose={onClose}
      primaryAction={hideUseAction
        ? undefined
        : {
            label: t('pluginCard.duplicate'),
            onClick: () => onDuplicate?.(record),
            disabled: !onDuplicate,
            busy: false,
            busyLabel: t('pluginCard.duplicating'),
            testId: `plugin-details-use-${record.id}`,
            menu: [
              {
                label: isApplying ? t('pluginCard.applying') : t('pluginCard.use'),
                onClick: () => onUse(record, 'use'),
                testId: `plugin-details-use-option-${record.id}`,
              },
            ],
          }}
      hideShareAction
    />
  );

  if (typeof document === 'undefined') return detail;
  return createPortal(detail, document.body);
}

function withReferenceBaseHref(html: string, cloneUrl: string): string {
  if (/<base\s/i.test(html)) return html;
  const baseHref =
    typeof window !== 'undefined'
      ? new URL(cloneUrl, window.location.href).href
      : cloneUrl;
  const base = `<base href="${escapeHtmlAttribute(baseHref)}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
  }
  return `${base}${html}`;
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
