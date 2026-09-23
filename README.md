# ScreenJoule

Electrothermal reactor-element models in 0D, 2D and 3D.

[Open ScreenJoule](https://robin-yk.github.io/ScreenJoule/)

ScreenJoule calculates whether a conducting element can reach a target temperature, how quickly it heats, and where temperature and current concentrate. The browser provides three workspaces:

- **0D:** resistance, supply-limited power, lumped temperature, heating time, and equivalent insulation thickness.
- **2D:** axisymmetric electrical and temperature fields, enclosure heat transfer, and heating/cooling transients.
- **3D:** shape and electrode studies, temperature-dependent electrical feedback, and optional Stokes gas flow with solid–gas heat transfer.

The application starts with a 3D hollow-tube example. Common cylinder dimensions, scalar properties, porosity, supply settings, and thermal surroundings transfer between compatible workspaces. Electrode settings and temperature-dependent property tables stay local. A 3D-only shape is preserved when visiting another tab.

## Run locally

Use Python 3 to build the pages and Node.js 22 or newer to run tests. Application calculations run in browser JavaScript.

```sh
python3 build.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Serve over HTTP so module workers can run.

```sh
npm test
```

Tests cover supply limits, electrical and thermal balances, mesh/time-step checks, insulation, and worker/direct execution parity.

## Models and research data

The 2D circuit uses mean element temperature to set total power; its local electrical field distributes that power. The 3D solver updates terminal conductance and the supply operating point from the temperature-dependent electrical field. Porous presets use solid fraction and effective properties. Gas flow uses constant-property incompressible Stokes equations.

- [Thermal surroundings and insulation](docs/common-insulation.md)
- [Porous-body approximation](docs/porous-3d.md)
- [Shared cylinder comparison](docs/shared-comparison.md)
- [Manuscript figures, inputs, and reproduction commands](research/README.md)

`src/` contains the application and solvers; `dist/` contains the generated site. `research/` contains retained study data and comparison scripts. Match the recorded inputs and solver version when reproducing a study. Hardware safety assessment remains a separate engineering task.

## Source and license

The 0D/2D source originated in [Electrification-Suite](https://github.com/robin-yk/Electrification-Suite). Original commits and copied-file hashes are recorded in [the source manifest](docs/source-manifest.json). Later engine changes are recorded in this repository's history.

MIT license. Copyright 2026 Yeonsu Kwak. See [CITATION.cff](CITATION.cff) for software citation metadata.
