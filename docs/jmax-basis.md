# Current-density limit (Jmax) basis

0D and 2D apply the preset Jmax as a fourth supply ceiling, I ≤ Jmax·A_eff, alongside the voltage, current and power ratings. 3D lists Jmax for reference and applies a J trip only when the user sets one.

Values were checked on 2026-09-24 against Mittal et al., Chem. Eng. J. 520 (2025) 166348, Table 1, and the sources it cites. Table 1 cites references [20, 22–31] as a group, so the basis of each Jmax entry is inferred from those references. Mittal et al. state that Jmax is unknown for many materials and use a constant 10⁷ A/m² when comparing materials.

| Preset | Jmax (A/m²) | Basis |
| --- | ---: | --- |
| SiC, 304 stainless steel, tungsten, titanium | 5×10⁶, 5×10⁶, 3×10⁷, 4.5×10⁶ | Table 1 |
| Copper | 1×10⁷ | Table 1. Insulated Cu wire ampacity is 2.1–3.7×10⁷ A/m² at 30 °C ambient (OEM Heaters technical guide, AWG 18–24). |
| SiSiC | 5×10⁶ | SiC value from Table 1 |
| CFP, FeCrAl, NiCr, Inconel 601 | 1×10⁷ | Mittal et al. comparison default; Table 1 lists none. NiCr resistance-wire ampacity is 1.5–2.1×10⁷ A/m² at 540–760 °C in still air (OEM Heaters guide, AWG 15–20). |
| Molybdenum | 1×10⁷ (was 3×10⁵) | Table 1 lists 3×10⁵. Its cited source ([31], SAM molybdenum electrodes) gives a maximum of 2–3 A/cm² (2–3×10⁴ A/m²) for glass-melting electrodes, an erosion limit rather than a heater limit and a factor of 10 below the tabulated value. |
| Aluminum | 1×10⁷ (was 5×10⁹) | Table 1 lists 5×10⁹ (5×10⁵ A/cm²), the scale of thin-film interconnect electromigration in integrated circuits ([27], Sze), not a bulk heater limit. |
| MoSi₂ | 3×10⁶ | Origin not traced. |

Molybdenum and aluminum now use the same 10⁷ A/m² default as the other untabulated metals. Neither preset appears in the manuscript figures; SiC, SiSiC, CFP and FeCrAl, which do, are unchanged.

Ampacity depends on wire size, temperature and cooling, so these values are screening ceilings, not material constants.
