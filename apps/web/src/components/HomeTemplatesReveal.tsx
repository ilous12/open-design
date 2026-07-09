// Kept as a named wrapper so HomeView's structure stays stable while the
// templates/reference gallery now loads immediately for first-run users.

import type { ReactNode } from 'react';

interface Props {
  /** Kept for the HomeView call site; first-run users now render immediately. */
  enabled: boolean;
  children: ReactNode;
}

export function HomeTemplatesReveal({ enabled, children }: Props) {
  void enabled;
  return <>{children}</>;
}
