# Shared cylinder comparison

The homepage starts with the common solid cylinder below. On tab changes, nominal cylinder dimensions, scalar resistivity, thermal conductivity, density, heat capacity and supply settings transfer from the active workspace to the next. No comparison panel is shown. Reloading restarts the common case. Electrode and boundary settings remain local. Temperature-dependent tables are not transferred. Noncylindrical shapes and porous bodies cannot currently be transferred to 3D; navigation gives an explicit warning instead of silently replacing the geometry.

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
