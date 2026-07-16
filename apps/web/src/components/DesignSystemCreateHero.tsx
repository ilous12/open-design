// Intro hero for the standalone "Create design system" page.
//
// Sets the product rhythm before the form: how many steps, roughly how long,
// and what the user walks away with — paired with an abstract, brand-agnostic
// preview of a generated system (palette / type scale / components) so the
// outcome feels tangible. Standalone-only; the embedded onboarding variant
// keeps its own compact framing.

import { Icon } from './Icon';
import styles from './DesignSystemCreateHero.module.css';
import { useI18n } from '../i18n';

const STEPS = [
  { n: 1, title: 'dsCreate.heroStep1Title', desc: 'dsCreate.heroStep1Desc' },
  { n: 2, title: 'dsCreate.heroStep2Title', desc: 'dsCreate.heroStep2Desc' },
  { n: 3, title: 'dsCreate.heroStep3Title', desc: 'dsCreate.heroStep3Desc' },
] as const;

// A calm, brand-agnostic palette — illustrative only.
const SWATCHES = ['#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#f43f5e'];

export function DesignSystemCreateHero({ stacked = false }: { stacked?: boolean } = {}) {
  const { t } = useI18n();

  return (
    <section className={`${styles.hero}${stacked ? ` ${styles.heroStacked}` : ''}`}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>
          <Icon name="sparkles" size={13} />
          {t('dsCreate.heroEyebrow')}
        </span>
        <h1 className={styles.title}>{t('dsCreate.heroTitle')}</h1>
        <p className={styles.lede}>{t('dsCreate.heroBody')}</p>
        <div className={styles.meta}>
          <span className={styles.metaPill}>
            <strong>3</strong> {t('dsCreate.heroMetaSteps')}
          </span>
          <span className={styles.metaDot} aria-hidden />
          <span className={styles.metaPill}>{t('dsCreate.heroMetaMinutes')}</span>
          <span className={styles.metaDot} aria-hidden />
          <span className={styles.metaPill}>{t('dsCreate.heroMetaDeliverables')}</span>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.n} className={styles.step}>
              <span className={styles.stepNo}>{step.n}</span>
              <span className={styles.stepText}>
                <strong>{t(step.title)}</strong>
                <em>{t(step.desc)}</em>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <ShowcasePreview t={t} />
    </section>
  );
}

function ShowcasePreview({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className={styles.showcase} aria-hidden>
      <div className={styles.showcaseGlow} />
      <div className={styles.showcaseCard}>
        <div className={styles.showcaseHead}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.showcaseTitle}>{t('dsCreate.heroShowcaseTitle')}</span>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('dsCreate.heroPalette')}</span>
          <div className={styles.swatches}>
            {SWATCHES.map((color) => (
              <span key={color} className={styles.swatch} style={{ background: color }} />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('dsCreate.previewTypeScale')}</span>
          <div className={styles.typeScale}>
            <span className={styles.typeLg}>Aa</span>
            <span className={styles.typeMd}>Aa</span>
            <span className={styles.typeSm}>Aa</span>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('dsCreate.heroComponents')}</span>
          <div className={styles.components}>
            <span className={styles.fauxBtn}>{t('dsCreate.buttonPrimary')}</span>
            <span className={styles.fauxBtnGhost}>{t('dsCreate.heroGhost')}</span>
            <div className={styles.fauxCard}>
              <span className={styles.fauxBar} />
              <span className={styles.fauxBarShort} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
