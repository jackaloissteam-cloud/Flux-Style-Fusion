---
name: Single-file Vite HTML
description: Reliable way to package a Vite application as one downloadable HTML file.
---

When combining Vite production output into a single HTML file, do not paste the built JavaScript directly inside a `<script>` element. React bundles can contain literal closing-script sequences in runtime strings, which the HTML parser treats as the end of the inline module and leaves the rest of the bundle visible as text. Embed the built module as base64 and dynamically import it from a Blob URL instead. Inline the compiled CSS and remove external font imports when the file must work without network access.

**Why:** The HTML parser recognizes `</script>` before JavaScript parsing, even when that sequence is inside a JavaScript string.

**How to apply:** For a downloadable, single-file export of a Vite app, use a small inline module bootstrap that base64-decodes the production bundle to bytes and imports a JavaScript Blob; verify the page in a browser after packaging.
