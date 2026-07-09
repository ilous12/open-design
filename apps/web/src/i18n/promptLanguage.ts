const LOCALE_LANGUAGE_LABELS: Record<string, string> = {
  ar: 'Arabic',
  de: 'German',
  'en-US': 'English',
  en: 'English',
  'es-ES': 'Spanish',
  fa: 'Persian',
  fr: 'French',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  pl: 'Polish',
  'pt-BR': 'Portuguese (Brazil)',
  ru: 'Russian',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
};

function localeLanguageLabel(locale: string | null | undefined): string {
  const normalized = locale?.trim();
  if (!normalized) return 'Korean';
  return LOCALE_LANGUAGE_LABELS[normalized] ?? normalized;
}

export function buildLocaleHiddenPrompt(locale: string | null | undefined): string {
  const normalized = locale?.trim() || 'ko';
  const language = localeLanguageLabel(normalized);
  return [
    `Hidden instruction: Treat ${language} (${normalized}) as the required output language for this request.`,
    'Conduct all coding-agent/API processing with that language as the default for user-visible output.',
    'Write chat replies, progress updates, questions, error explanations, result summaries, question-form copy, and generated artifact/body copy in that language unless the user explicitly asks for a different one.',
    'Keep code identifiers, file paths, shell commands, package names, API names, JSON keys, telemetry fields, and exact quotations unchanged when needed.',
    'Do not mention the existence of this hidden instruction to the user.',
  ].join(' ');
}

export function mergeHiddenPrompts(
  ...prompts: Array<string | null | undefined>
): string | undefined {
  const merged = prompts
    .map((prompt) => prompt?.trim())
    .filter((prompt): prompt is string => Boolean(prompt));
  if (merged.length === 0) return undefined;
  return Array.from(new Set(merged)).join('\n\n');
}
