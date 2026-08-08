---
name: Imported API rebuild
description: Rebuild and restart behavior when importing backend source into an existing managed API artifact.
---

When backend source is replaced during a project import, the managed API workflow may still be serving the previous bundled output until it is restarted. Confirm the live API routes after restarting rather than relying only on source files or typechecks.

**Why:** The imported source can be correct while the already-running bundle still exposes only the old routes, causing misleading 404 responses.

**How to apply:** Restart the exact managed API workflow after backend imports or backend/package changes, then verify a health route and one representative product/auth route through the shared proxy.