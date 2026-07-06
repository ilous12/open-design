// Help surface for `nd design-systems`. Kept pure and separate from cli.ts so a
// test can assert the advertised subcommands without spawning the CLI or
// stubbing process.exit / console.log.

export const DESIGN_SYSTEMS_USAGE = `Usage:
  nd design-systems list                       List design systems.
  nd design-systems show <id>                  Print one entry.
  nd design-systems rename <id> --title <new>  Rename an editable design system.
  nd design-systems download <id> [--out <p>]  Download a brand .zip (files + SKILLS.md).
  nd design-systems import-local <path>        Import a local project.
  nd design-systems import-github <url>        Import a public GitHub repo.
  nd design-systems import-shadcn <reference>  Import a shadcn registry item.
  nd design-systems rebuild-token-contract <id>  Start a token contract rebuild review.`;

// `help`, `--help`, and `-h` all route to the usage text above. Without the
// flag forms, `nd design-systems --help` falls through to the generic library
// list, which only advertises `list` and `show` and never mentions `rename`.
export function isDesignSystemsHelpArg(arg: string | undefined): boolean {
  return arg === 'help' || arg === '--help' || arg === '-h';
}
