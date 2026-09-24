# Default foam bar and shared cylinder comparison

## Default starting case

All three workspaces open on the same porous SiC foam bar (`src/default-case.js`): 30 × 8 × 8 mm, porosity 0.5, skeleton resistivity 0.000555556 Ω m, effective thermal conductivity 60 W/m K, skeleton density 3210 kg/m³, heat capacity 750 J/kg K, 60 W power setpoint under 150 V / 40 A / 2 kW ceilings, full-face ideal electrodes, and exposed surroundings at 20 °C with h = 12 W/m² K and emissivity 0.9. A square bar is represented exactly on the 3D Cartesian grid, so all three models use the same surface area; the 2D workspace uses its stated equivalent cylinder. Saved 0D/2D settings on the device take precedence over this default.

Browser check on first load:

| Model | Mean temperature (°C) | Maximum (°C) |
| --- | ---: | ---: |
| 0D | 707.9 | – |
| 2D, equivalent cylinder | 709.5 | 712.8 |
| 3D, 12 × 12 × 45 grid | 709.5 | 712.9 |

## Shared cylinder comparison

The 0D, 2D and 3D workspaces are independent: each keeps its own inputs, and switching tabs transfers nothing. To compare them, enter the common solid cylinder below in each workspace by hand. Electrode and boundary settings are model-specific. Temperature-dependent tables are not part of this comparison.

The comparison uses constant SiC proxy properties (electrical resistivity 0.000555556 Ω m, thermal conductivity 120 W/m K, density 3210 kg/m³, heat capacity 750 J/kg K). Every surface has h = 100 W/m² K to 20 °C. Radiation, enclosure, gas flow and electrical contact resistance are disabled. This is a numerical comparison, not an experimental reactor validation.

## Browser check

For diameter 10 mm, length 15 mm and actual input 10 W:

| Model | Mean temperature (°C) |
| --- | ---: |
| 0D | 179.2 |
| 2D | 179.4 |
| 3D, 32 × 32 × 48 Cartesian grid | 152.0 |

The smooth cylinder has surface area 0.0006283185 m². The 3D Cartesian representation has area 0.00075859375 m², about 20.7% larger. Its extra cooling area explains the lower temperature under the imposed uniform convection. No correction factor was fitted to force agreement. Increasing Cartesian resolution alone does not necessarily remove a stair-step surface-area bias.

The 2D comparison uses an element-only axisymmetric mesh and Robin boundaries including the half-cell conduction resistance. Normal enclosure calculations retain their original mesh and boundaries. The automated shared-convection test checks the analytical 0D heat balance, 2D energy closure, represented volume and the small-Biot mean-temperature agreement.
