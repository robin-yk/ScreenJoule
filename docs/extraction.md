# Extraction record

Date: 2026-09-07.

The standalone repository retains the integrated site's application sources and tests. The original site checkout and Electrification-Suite were not modified. The source manifest records the two source commits and SHA-256 hashes before packaging edits.

Packaging edits:

- Create the output directory during a clean build.
- Retain the upstream MIT license and provenance in generated distributions.
- Declare ES-module scope for the 0D/2D module directories.
- Retarget copied 0D/2D test imports to the preserved numerical core.
- Make the Figure 5 redraw use repository-local inputs and helpers.
- Add build/test commands, continuous integration and software citation metadata.

The 3D engine and 0D/2D numerical solver were copied unchanged. The preserved upstream cross-check file has a trailing blank line relative to its recorded upstream Git blob; its calculations are unchanged.

Excluded: private manuscript drafts, advisor comments, retrospective notes, account/hosting configuration, earlier site versions, stopped study output, and pulse-example research data. Existing engine capabilities and their tests were retained; this extraction does not remove functionality from the application.

The source extraction is a development snapshot. A final paper release still requires consolidation of the full figure-generation pipeline and explicit matching of historical study engines to the selected manuscript version. No DOI or complete manuscript-release claim is attached to this snapshot.
