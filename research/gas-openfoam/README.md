# Gas-flow and OpenFOAM comparison (Figure S9)

Six cases compare ScreenJoule and OpenFOAM 2512 for fully developed gas flow and conjugate heat transfer. This package retains Figure S9 inputs, outputs and numerical sources used in the September 23, 2026 manuscript.

## Conditions and results

A 40 × 10 × 2 mm heater occupies a 40 × 20 × 6 mm channel and receives 1 W. Solid conductivity is 20 W m⁻¹ K⁻¹. Gas density, heat capacity, conductivity and viscosity are 1.2 kg m⁻³, 1005 J kg⁻¹ K⁻¹, 0.026 W m⁻¹ K⁻¹ and 1.8 × 10⁻⁵ Pa s. Gas inlet and channel sidewalls are at 25 °C. Both heater ends exchange heat with a 25 °C sink through a 200 W m⁻² K⁻¹ coefficient. Actual inlet flow rates are 1, 10 and 100 cm³ min⁻¹; meshes are 12 × 9 × 24 and 24 × 9 × 48. Radiation and reactions are omitted.

The independently assembled equations use matched harmonic conduction and first-order upwind advection. The two meshes retain nine height cells; pressure drop changes by approximately 9.4% between them. Maximum inter-code differences are approximately 1.26 × 10⁻⁶ K (solid), 1.05 × 10⁻⁶ K (gas), and 1.56 × 10⁻¹² m s⁻¹ (velocity).

## Replot and verify retained results

Requires Python 3 with NumPy, Matplotlib and Pillow. From this directory:

```sh
python3 openfoam/compare.py
python3 si/plot.py
python3 report.py
```

The first command checks all six coordinate-matched field comparisons, mass and energy closure, and retained mesh-check reports. The second regenerates the six-panel Figure S9 PNG/SVG and dimensional checks. The third generates two additional temperature/profile plots and mesh-sensitivity checks. These commands were tested from the portable package. Arial or Helvetica gives the original font; Matplotlib falls back to DejaVu Sans if unavailable.

`results.json` stores ScreenJoule inputs and fields. `openfoam/cases/*/fields.json` stores OpenFOAM cells as `[x, y, z, T, uz, pressure, solid]`, with metres, °C, m s⁻¹, Pa, and a 1/0 solid flag. Heat-budget terms are watts. `openfoam/comparison.json` and `si/field-comparison.json` store comparison metrics.

## Rerun the solvers

`node run.cjs` regenerates ScreenJoule results using the exact frozen `source/flow.js` and `source/engine.js` snapshots. Their SHA-256 hashes are recorded in `results.json`. `python3 openfoam/prepare.py` generates all six OpenFOAM cases and the custom solver. Run the generated case directory at `/work` in the pinned OpenFOAM 2512 image:

```sh
docker run --rm -v "$PWD/openfoam:/work" \
  opencfd/openfoam-default@sha256:6e6b5b5d1762a4ccf7aaff7dd965586260811d28698596483ac244e1f69ded96 \
  bash /work/run-openfoam.sh
python3 openfoam/compare.py
python3 si/plot.py
```

The custom OpenFOAM solver performs its own matrix assembly; ScreenJoule temperature and velocity fields enter only the comparison. Compiled binaries, meshes and intermediate dictionaries are generated locally and excluded from this package. Reruns replace retained results and plots. OpenFOAM was not rerun during this packaging step; the retained six-case outputs were rechecked.
