# Literature comparison inputs

[validation-literature.json](validation-literature.json) stores the reactor cases loaded by the application. Each entry includes inputs, reference values and a classification stating its calibration or comparison basis. The filename is retained for continuity; these cases do not all constitute independent experimental validation.

The build reads this file and publishes a copy at `dist/validation-literature.json`. To regenerate the comparison from the current numerical engine, run this command from the repository root:

```sh
node scripts/benchmark-literature.js
```

This replaces the retained JSON. Review changed inputs, numerical results and assumptions before adopting the output. The [Zheng duty reconstruction](../zheng-duty-check.cjs) uses its Zheng reference preset.
