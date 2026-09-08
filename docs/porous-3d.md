# Homogeneous porous heater

3D porosity represents void volume inside the heater envelope. The grid and external area remain unchanged. For void fraction φ, skeleton density is multiplied by (1−φ); mass-specific Cp is unchanged. Skeleton electrical resistivity, including its temperature table, is divided by (1−φ). Selecting effective resistivity uses the measured body-scale value directly. Thermal conductivity and its table are always body-scale effective values and receive no additional porosity correction.

This matches the 0D/2D explicit porous-body approximation: solid conduction area and mass scale with solid fraction, and effective k is supplied independently. Shared cylindrical cases transfer porosity, skeleton-equivalent scalar resistivity, effective k, skeleton density and Cp. Temperature-dependent tables and local boundary settings remain outside scalar case sharing.

Finite electrodes retain their own dense properties. Contact resistance is defined per envelope contact area. Current density is reported per envelope area. The approximation does not resolve pore topology, tortuosity, anisotropy, gas flow through pores, or internal pore radiation. Use measured effective properties for foam or monolith specimens when available; porosity alone does not determine these properties. Geometrically resolved holes and homogenized porosity must represent separate void populations.

The automated checks cover resistance scaling, adiabatic heat storage, unchanged effective resistivity and conductivity, finite-electrode separation and invalid-input rejection. These checks do not add a new Zheng experimental comparison.
