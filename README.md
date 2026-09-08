# ScreenJoule

Electrothermal design of reactor elements under power-supply and electrode constraints.

ScreenJoule provides browser workspaces for lumped (0D) screening, axisymmetric (2D) temperature fields, and three-dimensional electrode and geometry studies. Calculations run in JavaScript in the browser. Python is used to assemble the static pages and redraw research figures; it is not a server-side solver.

## Run locally

Requirements: Python 3 and Node.js 22 or newer for development and testing. The web application itself has no package-install requirement.

```sh
python3 build.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. The initial workspace is 3D. Use the 0D and 2D tabs for the other workspaces. Serve over HTTP because module workers may not run from a `file://` URL.

```sh
npm test
```

Tests cover electrical and thermal limits, conservation, selected mesh/time-step checks, screening behavior, and worker/direct execution parity. They do not establish accuracy for arbitrary geometries or experimental reactors.

## Repository contents

| Path | Contents |
| --- | --- |
| `src/` | Application source, 3D engine, interface and worker adapters |
| `src/suite-upstream/` | Preserved 0D/2D source from Electrification-Suite |
| `dist/` | Generated static application, ready for HTTP hosting |
| `test*.js`, `test-unified.mjs`, `tests/` | Executable checks |
| `validation*.json` | Recorded implementation-check outputs |
| `research/` | Selected frozen study data and Figure 5 rendering script |
| `docs/source-manifest.json` | Source commits, copied paths and original SHA-256 hashes |

## Model scope

0D screens the electrical operating point and lumped heat balance. The 2D core uses a mean-temperature supply closure with spatial electrical and thermal calculations; spatial resistance changes do not fully update the global circuit. The 3D workspace uses its own geometry and boundary definitions. Switching tabs does not make their boundary conditions identical or automatically transfer a common physical case.

Material presets, contact properties and heat-transfer inputs require assessment for the intended experiment. Literature comparisons retain differences between reported observables and modeled quantities. Some 3D features extend beyond the manuscript's demonstrated cases. Do not use this research software to certify hardware safety, service temperature or lifetime.

## Research reproducibility status

This is a clean development snapshot, not a frozen manuscript release. `research/README.md` states which data and rendering steps are included and which provenance checks remain. No private manuscript, advisor correspondence, development retrospective or hosting credentials are included.

## Provenance

The 0D/2D code originated in [Electrification-Suite](https://github.com/robin-yk/Electrification-Suite). Its development history remains there. The integrated site source was extracted from commit `d25de092b71f2ef78148962701bde47b9af184ed`; the local suite snapshot was `eb5171b5183519bf2d54c9b0b622f9d06faf765d`. Exact copied-file hashes are recorded in the manifest. Packaging changes preserve the numerical engines.

MIT license. Copyright 2026 Yeonsu Kwak. See `CITATION.cff` for software citation metadata. A manuscript DOI and archival release DOI have not yet been assigned.
