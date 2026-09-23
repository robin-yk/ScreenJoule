# Research data

Study inputs, retained fields and figure assets accompany the browser application.

- **Figure 4 — electrode contact and supply limits:** `3d-browser-check/` contains the 20-case width/power sweep and two temperature fields. `plot-electrode-study.py` redraws those arrays with the original study layout.
- **Figure 5 — SiSiC geometries:** [geometry-sisic/](geometry-sisic/README.md) contains the current figure, four native browser images, and exact input/result records. The original capture automation and complete cell fields were not retained.
- **Figure S9 — gas-flow comparison:** [gas-openfoam/](gas-openfoam/README.md) contains six matched cases, frozen ScreenJoule sources, an independent OpenFOAM solver, field comparisons and plotting commands.
- **SiSiC foam (Zheng):** `zheng-duty-check.cjs` reconstructs ten reported operating points using measured power and enthalpy duty. One point sets the heat-loss coefficient; `zheng-duty-check.json` records the remaining nine comparisons.
- **0D/2D studies:** `data/` retains selected study outputs with their original model and generator metadata.

## Electrode-study redraw

```sh
python3 -m pip install -r research/requirements.txt
python3 research/plot-electrode-study.py
```

The command writes the retained-data plot to `research/output/`. Numerical reruns require the inputs and solver version recorded for each study. Figure-specific packages describe their available reproduction steps.
