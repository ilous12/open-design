# apps/packaged

Thin packaged Electron runtime entry for Design For AIR.

This package starts the packaged daemon and web sidecars, registers the `nd://`
entry protocol, and then delegates to `@nn-design/desktop/main` for the host
window. Product logic stays in `apps/daemon`, `apps/web`, and `apps/desktop`.
