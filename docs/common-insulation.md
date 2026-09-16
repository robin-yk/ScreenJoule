# Shared thermal surroundings

The 0D, 2D and 3D workspaces offer exposed surroundings, a finite insulation layer, and existing local reactor/electrode settings. Common inputs transfer on tab changes: outside air temperature, external convection coefficient, outer emissivity, insulation thickness and conductivity. No perfect-insulation option is provided. External h, thickness and conductivity must be finite and positive for the insulated mode.

The common approximation places thickness/conductivity in series with external convection and radiation on every external face, including end faces. Radiation is evaluated at the outer layer temperature. Area is held constant; this is an equivalent surface resistance, not a geometrically resolved thick cylindrical shell. 0D applies this resistance to the envelope area; 2D and 3D additionally retain the solid half-cell conduction resistance. Insulation heat capacity is omitted. Geometry-dependent surface areas, including voxel staircasing in 3D, still differ.

Use local settings for separate electrode cooling, resolved reactor walls and gas flow. Existing local settings and historical benchmark inputs retain their previous thermal paths. The common default exposed mode retains the previous shared-case h=100 W/m²K, 20 °C and zero emissivity. The editable 5 mm / 0.1 W/mK insulation values are demonstration inputs, not Zheng or Wismann measurements.

The added steady-only processDuty input is for research runs with known total process enthalpy duty. It subtracts a uniform volumetric heat sink from heater cells and is included in energy closure. It is rejected with resolved gas flow or transient studies to avoid double counting and unsupported duty schedules. It is not a reaction model or a public UI control.

Existing manuscript figures need recalculation only when their actual model inputs or thermal treatment change. Adding these opt-in controls does not itself replace manuscript data. The one-point Zheng research reconstruction and its held-out discrepancies are recorded separately in research/zheng-duty-check.json.

## 0D insulation screening

The collapsed Insulation screening panel uses the current envelope area, delivered heater power, process/gas duty and target or measured temperature. It solves the outside convection–radiation balance, then calculates equivalent area-specific resistance and thickness for a user-specified conductivity. A thickness sweep includes the exposed case at zero thickness. Results remain separate from the active reactor inputs.

This fixed-power, constant-area calculation gives an equivalent layer rather than a resolved cylindrical shell. An inferred resistance includes losses not separately entered; thickness depends on the assumed conductivity. Supply limits remain in the main model. Tests check inverse/forward power closure, the analytical convection-only case, monotonic thickness response and invalid inputs.
