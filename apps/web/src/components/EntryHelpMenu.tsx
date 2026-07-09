// Help launcher anchored to the bottom of the entry nav rail.
//
// Mirrors the Lovart-style "?" affordance shown in the bottom-left
// corner of the workspace: a single round button that opens a small
// popover with the support links we want every user to be one click away
// from: AIR service team help and feature requests.
//
// The links open in a new tab (with safe `noopener` rel) and are
// labeled via the i18n dictionary so locale switching keeps the menu
// in the user's language.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { popoverIn } from '../motion';
import { useAnalytics } from '../analytics/provider';
import {
  trackHelpPopoverClick,
  trackHelpPopoverSurfaceView,
  trackHomeNavClick,
} from '../analytics/events';
import { openExternalUrl } from '../providers/registry';
import { Icon } from './Icon';
import { useT } from '../i18n';

const HELP_EMAIL = 'gwanghee.lee@sk.com';

function buildMailtoUrl(subject: string, body: string): string {
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${HELP_EMAIL}?${params.toString()}`;
}

const HELP_MAILTO = buildMailtoUrl(
  '[Design For AIR] AIR 서비스팀 도움 요청',
  [
    '안녕하세요. Design For AIR 사용 중 도움이 필요합니다.',
    '',
    '문의 유형:',
    '계정/로그인',
    '실행 오류',
    '리믹스/프로젝트 문제',
    '기타',
    '',
    '발생 화면 또는 기능:',
    '예: 홈, 레퍼런스, 리믹스, 편집화면',
    '',
    '문의 내용:',
    '',
    '재현 방법:',
    '1.',
    '2.',
    '3.',
    '',
    '기대한 동작:',
    '',
    '실제 동작 또는 오류 메시지:',
  ].join('\n'),
);

const FEATURE_MAILTO = buildMailtoUrl(
  '[Design For AIR] 기능 제안',
  [
    '안녕하세요. Design For AIR 기능 제안을 전달드립니다.',
    '',
    '제안 제목:',
    '',
    '제안 배경:',
    '어떤 업무/상황에서 필요한지 작성해주세요.',
    '',
    '원하는 기능:',
    '',
    '기대 효과:',
    '시간 절감, 품질 향상, 협업 개선 등',
    '',
    '참고 예시:',
    '유사 서비스, 화면, 링크 등이 있다면 작성해주세요.',
  ].join('\n'),
);

export function EntryHelpMenu() {
  const t = useT();
  const analytics = useAnalytics();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  async function openHelpMail(url: string) {
    await openExternalUrl(url);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // P1 surface_view — fire once each time the help popover opens so the
  // "how often is help discovered" funnel doesn't conflate hover-clicks
  // away with intentional opens.
  useEffect(() => {
    if (!open) return;
    trackHelpPopoverSurfaceView(analytics.track, {
      page_name: 'home',
      area: 'help_resources_popover',
    });
  }, [open, analytics.track]);

  return (
    <div className="entry-help-menu" ref={wrapRef}>
      <button
        type="button"
        className="entry-nav-rail__btn entry-help-menu__trigger"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) {
              // P0 ui_click area=nav element=help — emitted at the moment
              // the user discovers the help destination, not for every
              // closed-state click.
              trackHomeNavClick(analytics.track, {
                page_name: 'home',
                area: 'nav',
                element: 'help',
              });
            }
            return next;
          });
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('entry.helpAria')}
        data-tooltip={t('entry.helpAria')}
        data-testid="entry-help-trigger"
      >
        <Icon name="help-circle" size={18} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="entry-help-popover"
            role="menu"
            aria-label={t('entry.helpMenuAria')}
            variants={popoverIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button
              type="button"
              className="entry-help-popover__item"
              role="menuitem"
              onClick={() => {
                trackHelpPopoverClick(analytics.track, {
                  page_name: 'home',
                  area: 'help_resources_popover',
                  element: 'get_help_on_github',
                  surface: 'popover',
                });
                void openHelpMail(HELP_MAILTO);
              }}
            >
              <span className="entry-help-popover__icon" aria-hidden>
                <Icon name="comment" size={14} />
              </span>
              <span>{t('entry.helpGetHelp')}</span>
            </button>
            <button
              type="button"
              className="entry-help-popover__item"
              role="menuitem"
              onClick={() => {
                trackHelpPopoverClick(analytics.track, {
                  page_name: 'home',
                  area: 'help_resources_popover',
                  element: 'submit_a_feature_request',
                  surface: 'popover',
                });
                void openHelpMail(FEATURE_MAILTO);
              }}
            >
              <span className="entry-help-popover__icon" aria-hidden>
                <Icon name="sparkles" size={14} />
              </span>
              <span>{t('entry.helpSubmitFeature')}</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
