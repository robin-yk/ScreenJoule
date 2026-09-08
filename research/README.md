# Research data

`data/` contains selected 2026-09-07 0D/2D study outputs. Their original model and generator metadata remain in each file. These are archived outputs, not a claim that every study was rerun against this repository. Stopped runs, pulse examples, private manuscripts and obsolete figure versions were excluded.

`3d-browser-check/` contains the 20-case terminal-width/power study, two Figure 5 fields and a settings file. Settings alone do not define a universal experiment; inspect each result's parameters and metadata. The historical study engine must be matched before calling a new execution an exact reproduction.

To redraw Figure 5 from its saved numerical arrays:

```sh
python3 -m pip install -r research/requirements.txt
python3 research/plot-figure5.py
```

Outputs are written to `research/output/`. This redraw does not rerun a solver. Font substitution can change text layout; the script checks panel proportions and text bounds.

Before freezing a manuscript release, reconcile every main/SI figure with its generator, inputs, historical solver and final Word caption. The complete main/SI regeneration pipeline is not yet consolidated here. Do not label this snapshot a complete publication archive.
