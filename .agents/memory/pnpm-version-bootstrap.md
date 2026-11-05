---
name: pnpm bootstrap mismatch
description: Recovery context for this workspace when a pnpm version mismatch blocks managed workflows.
---

The workspace can request a pnpm version newer than the one available in the environment. In that case, workflow startup may repeatedly try to install the requested pnpm and abort before running the actual project command. Disabling automatic package-manager version switching in the repository npm config allowed the available pnpm to run the existing workspace scripts and restored the managed workflows.

**Why:** The self-bootstrap loop failed across all configured workflows even though their dependencies and application code were healthy.

**How to apply:** If workflow logs show `pnpm add pnpm@...` failures before the service command starts, compare the root `packageManager` declaration with the installed pnpm version. Test `manage-package-manager-versions=false` before changing dependencies or rewriting workflow commands.
