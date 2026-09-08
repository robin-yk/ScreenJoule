# Extraction checks

2026-09-07, macOS, Node.js 26.4.0, Python 3.9.6.

- Clean static build completed.
- All 16 existing site test scripts completed successfully, including worker/direct parity.
- All 56 copied 0D/2D Node subtests passed; zero failures and zero skipped tests.
- Figure 5 redrew from saved arrays using NumPy and Matplotlib. The script reported no layout-check issues; all four panel axes were square. This was a rendering check, not a new simulation or independent physical validation.
- Generated HTML local `src` and `href` targets resolved.
- Application numerical engines were preserved byte-for-byte from the site source.
- Targeted scans found no credential patterns or user-specific absolute filesystem paths in the staged content.

No new browser-interaction test or complete paper-wide numerical rerun was performed during extraction. Existing whitespace in copied upstream/generated files was preserved to avoid unrelated source changes. CI is configured for Node.js 22 and Python 3.12; the GitHub run is a separate check from this local result.
