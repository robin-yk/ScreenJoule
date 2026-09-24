# SiSiC geometry comparison (Figure 5)

**2026-09-24 update, panel D.** The solid cylinder was first solved on a 40 × 40 × 36 Cartesian grid, whose stair-step boundary exposes 688.4 mm² of lateral surface against the exact 540.6 mm² (+27%, the 8/2π perimeter ratio that persists under refinement). Rerun with identical inputs on the solid annular grid (14 × 96 × 48, 59,952 cells), the mean rises from 1033.3 to 1120.1 °C and the maximum from 1037.2 to 1124.0 °C; a 10 × 64 × 36 annular grid gives the same mean and maximum to 0.1 K. The Cartesian rerun reproduces the archived 1033.297 °C exactly, so the change comes from the surface representation alone. Voltage and current are unchanged (2.838 V, 35.24 A). Panels A to C already used exact surfaces (annular tube, rectangular bars) and are unchanged. `3-result-annular.json` and `3-canvas-annular.png` hold the new run; `figure-5-v1-cartesian.html/png` keep the previous plate. The new panel was rendered in the browser at the recorded view (yaw 0.85, pitch 0.32, zoom 1.3) with the colour scale fixed to 500–1200 °C.

Retained inputs, statistics and native browser images for the current Figure 5: hollow tube, thin bar, narrow-center bar and solid cylinder. The source calculation uses the ScreenJoule SiSiC catalog preset at 100 W, emissivity 0.8, ambient 25 °C, external convection coefficient 15 W m⁻² K⁻¹, no gas flow, and no end-contact heat transfer. Supply ceilings are 150 V, 40 A and 2 kW. Solid volumes are 1.000–1.021 cm³.

| Panel | Geometry | Mean (°C) | Maximum (°C) | Maximum–minimum (K) |
|---|---|---:|---:|---:|
| A | Hollow tube | 844.033 | 844.271 | 0.672 |
| B | Thin bar | 912.291 | 915.122 | 8.035 |
| C | Narrow-center bar | 1003.213 | 1052.133 | 76.571 |
| D | Solid cylinder | 1120.088 | 1124.045 | 7.401 |

`provenance.json` and `0-result.json` through `3-result.json` retain exact input dimensions, property tables, mesh settings, electrical operating points and residuals. `0-canvas.png` through `3-canvas.png` are the original browser-rendered views. `figure-5.html` is the self-contained figure plate; `figure-5.png` is the retained assembled image. The tube uses a longitudinal half-cutaway for display; statistics describe the full body. All panels use a 500–1200 °C scale and the view recorded in `provenance.json`.

## Reproduction boundary

The retained HTML can display the original plate offline. Exact numerical inputs are available for rerunning the geometries in ScreenJoule. This package does not contain the original browser-capture automation, a pinned solver revision for these four runs, or their complete cell fields. It therefore preserves Figure 5 and its numerical input/result records, but does not provide a verified end-to-end regeneration command for the native 3D images. The original provenance records the public application URL used for those runs.
