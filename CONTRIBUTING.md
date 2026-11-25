# Contributing

ScreenJoule accepts improvements to its models, numerical checks, documentation and interface. For a bug report, include the model workspace, input values, observed result, expected behavior and browser or runtime version. Remove private or unpublished information before sharing a report.

## Local workflow

Use Python 3 and Node.js 22 or later. No npm dependencies are required for the current build and test commands.

```sh
python3 build.py
npm test
python3 -m http.server 8000 --directory dist
```

On Windows, use `python` instead of `python3` if needed. Open http://localhost:8000 to inspect the application.

## Changes

- Edit application and numerical source in `src/`; regenerate `dist/` with `build.py`.
- Keep regression scripts in `tests/regression/` and their reports in `tests/results/`.
- Place new Node test suites in `tests/` with a `.test.mjs` filename.
- Keep study-specific inputs, retained solver versions and outputs with their package under `research/`.
- Keep assumptions, units, source references and fitted quantities explicit. Separate numerical verification from experimental validation.

For a numerical change, run the relevant conservation or analytical checks and the full test runner. For an interface change, inspect the affected workspace in a browser. Describe the change and checks in the pull request.

The OpenFOAM comparison has separate requirements in [its README](research/gas-openfoam/README.md). The standard test runner does not execute OpenFOAM.
