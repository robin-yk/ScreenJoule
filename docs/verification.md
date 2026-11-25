# Verification and validation

The evidence has three roles: checking the numerical implementation, comparing independent implementations, and comparing predictions with experiments. A check in one category does not establish the others.

## Numerical implementation

After building the application, run `npm test` from the repository root. The runner executes [regression scripts](../tests/regression/) and the Node test suites in [tests/](../tests/README.md).

The tests cover analytical electrical and thermal cases, conservation, mesh and time-step refinement, supply limits, electrode contacts, thermal surroundings, transient heating, and worker/direct execution parity. Their reports are stored in [tests/results/](../tests/results/). Tests do not rerun the complete OpenFOAM study.

## OpenFOAM comparison

The [comparison package](../research/gas-openfoam/README.md) contains six cases: three flow rates on two meshes. It compares fully developed gas flow and conjugate heat transfer with an independently assembled custom solver in OpenFOAM 2512. Both implementations use matched harmonic conduction and first-order upwind advection. Radiation and chemical reactions are omitted.

The package retains inputs, frozen ScreenJoule sources, coordinate-matched fields, balance checks and reproduction commands. Its README reports both close inter-code agreement and remaining pressure-drop mesh sensitivity. These results apply to the recorded low-power, constant-property cases.

## Experimental and literature comparisons

The application reads presets from [research/literature/validation-literature.json](../research/literature/validation-literature.json). Each entry has reference values, model inputs and a classification describing its comparison basis. Some cases use a calibration point or prescribed resistance fit; these are not independent prediction tests.

The [research index](../research/README.md) links the Zheng duty reconstruction, which uses measured power and enthalpy duty, with one point setting a heat-loss coefficient. Review its assumptions and calibration status before interpreting the comparison.

## Model scope

The optional gas model uses constant-property, incompressible Stokes flow. Porous bodies use effective properties; displayed pores are not resolved pore-scale meshes. The 2D and 3D models use different electrical feedback formulations, described in the [project overview](../README.md#scientific-checks-and-limits).

Reproduction requires the recorded inputs and solver version. Historical study sources remain preserved beside their results. See the [shared-cylinder checks](shared-comparison.md), [porous-body assumptions](porous-3d.md), and [thermal surroundings](common-insulation.md) for details.
