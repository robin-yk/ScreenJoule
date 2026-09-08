/* Resistivity in the source catalog is Ω cm; solver inputs are Ω m. */
const materialCatalog=[
  {
    "name": "CFP",
    "rhoOhmCm": 0.05,
    "density": 452,
    "cp": 990,
    "k": 400,
    "jmax": 10000000,
    "source": "Mittal et al. (2025), Table 1",
    "model": "constant; anisotropy not represented",
    "id": "catalog-0",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "SiC",
    "rhoOhmCm": 0.0555556,
    "density": 3210,
    "cp": 750,
    "k": 120,
    "jmax": 5000000,
    "source": "Mittal et al. (2025), Table 1",
    "model": "constant grade proxy",
    "id": "catalog-1",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "SiSiC (Si-infiltrated SiC)",
    "rhoOhmCm": 0.08,
    "density": 3050,
    "cp": 680,
    "k": 140,
    "jmax": 5000000,
    "rhoTable": [
      [
        20,
        0.08
      ],
      [
        300,
        0.028
      ],
      [
        550,
        0.0179
      ],
      [
        650,
        0.0174
      ],
      [
        750,
        0.0165
      ],
      [
        1000,
        0.0155
      ],
      [
        1350,
        0.015
      ]
    ],
    "kTable": [
      [
        20,
        140
      ],
      [
        600,
        60
      ],
      [
        1000,
        45
      ],
      [
        1350,
        40
      ]
    ],
    "source": "550-750 °C bulk ρ back-calculated from Zheng et al., AIChE J. 69, e17620 (2022), Table 2; RT branch is a commercial SiC-element proxy",
    "model": "ρ(T) table; RT resistivity varies widely between SiSiC grades, so prefer a datasheet; free Si melts at 1414 °C",
    "id": "catalog-2",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "MoSi₂",
    "rhoOhmCm": 0.000025,
    "density": 6500,
    "cp": 420,
    "k": 30,
    "jmax": 3000000,
    "rhoTable": [
      [
        20,
        0.000025
      ],
      [
        200,
        0.00007
      ],
      [
        600,
        0.00015
      ],
      [
        1000,
        0.00023
      ],
      [
        1400,
        0.0003
      ],
      [
        1800,
        0.00035
      ]
    ],
    "kTable": [
      [
        20,
        30
      ],
      [
        600,
        30
      ],
      [
        1200,
        15
      ],
      [
        1800,
        15
      ]
    ],
    "source": "Kanthal Super handbook",
    "model": "digitized handbook curve",
    "id": "catalog-3",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "Kanthal A-1 (FeCrAl)",
    "rhoOhmCm": 0.000145,
    "density": 7100,
    "cp": 460,
    "k": 11,
    "jmax": 10000000,
    "rhoFactor": [
      [
        20,
        1
      ],
      [
        100,
        1
      ],
      [
        200,
        1
      ],
      [
        300,
        1
      ],
      [
        400,
        1
      ],
      [
        500,
        1.01
      ],
      [
        600,
        1.02
      ],
      [
        700,
        1.02
      ],
      [
        800,
        1.03
      ],
      [
        900,
        1.03
      ],
      [
        1000,
        1.04
      ],
      [
        1100,
        1.04
      ],
      [
        1200,
        1.04
      ],
      [
        1300,
        1.04
      ],
      [
        1400,
        1.05
      ]
    ],
    "source": "Kanthal A-1 wire datasheet, accessed 2026-09-07",
    "model": "Ct, k(T), Cp(T) interpolation; 20–1400 °C",
    "id": "catalog-4",
    "referenceC": 20,
    "status": "Manufacturer Ct, k and Cp checked. k = 11 W/m K at 20–50 °C is an explicit extension from the first k datum at 50 °C.",
    "url": "https://www.kanthal.com/en/products/datasheets/material-datasheets/wire/resistance-heating-wire-and-resistance-wire/kanthal_a_1/",
    "kTable": [
      [
        20,
        11
      ],
      [
        50,
        11
      ],
      [
        600,
        20
      ],
      [
        800,
        22
      ],
      [
        1000,
        26
      ],
      [
        1200,
        27
      ],
      [
        1400,
        35
      ]
    ],
    "cpTable": [
      [
        20,
        460
      ],
      [
        200,
        560
      ],
      [
        400,
        630
      ],
      [
        600,
        750
      ],
      [
        800,
        710
      ],
      [
        1000,
        720
      ],
      [
        1200,
        740
      ],
      [
        1400,
        800
      ]
    ]
  },
  {
    "name": "Nikrothal 80 (NiCr)",
    "rhoOhmCm": 0.000109,
    "density": 8300,
    "cp": 460,
    "k": 15,
    "jmax": 10000000,
    "rhoFactor": [
      [
        20,
        1
      ],
      [
        100,
        1.01
      ],
      [
        200,
        1.02
      ],
      [
        300,
        1.03
      ],
      [
        400,
        1.04
      ],
      [
        500,
        1.05
      ],
      [
        600,
        1.04
      ],
      [
        700,
        1.04
      ],
      [
        800,
        1.04
      ],
      [
        900,
        1.04
      ],
      [
        1000,
        1.05
      ],
      [
        1100,
        1.06
      ],
      [
        1200,
        1.07
      ]
    ],
    "source": "Nikrothal 80 wire datasheet, accessed 2026-09-07",
    "model": "Ct, k(T), Cp(T) interpolation; joint range 20–1100 °C",
    "id": "catalog-5",
    "referenceC": 20,
    "status": "Manufacturer Ct, k and Cp checked. Cp at 20 °C is 460 J/kg K (supplied comparison table: 450).",
    "url": "https://www.kanthal.com/en/products/datasheets/material-datasheets/wire/resistance-heating-wire-and-resistance-wire/nikrothal-80/",
    "kTable": [
      [
        20,
        15
      ],
      [
        100,
        15
      ],
      [
        200,
        15
      ],
      [
        300,
        15
      ],
      [
        400,
        17
      ],
      [
        500,
        19
      ],
      [
        600,
        21
      ],
      [
        700,
        22
      ],
      [
        800,
        24
      ],
      [
        900,
        26
      ],
      [
        1000,
        28
      ],
      [
        1100,
        30
      ]
    ],
    "cpTable": [
      [
        20,
        460
      ],
      [
        100,
        460
      ],
      [
        200,
        480
      ],
      [
        300,
        500
      ],
      [
        400,
        520
      ],
      [
        500,
        540
      ],
      [
        600,
        560
      ],
      [
        700,
        600
      ],
      [
        800,
        630
      ],
      [
        900,
        650
      ],
      [
        1000,
        670
      ],
      [
        1100,
        700
      ]
    ]
  },
  {
    "name": "Inconel 601",
    "rhoOhmCm": 0.000118,
    "density": 8110,
    "cp": 448,
    "k": 11.2,
    "jmax": 10000000,
    "rhoTable": [
      [
        20,
        0.000118
      ],
      [
        100,
        0.0001192
      ],
      [
        200,
        0.0001207
      ],
      [
        300,
        0.000122
      ],
      [
        400,
        0.0001229
      ],
      [
        500,
        0.0001239
      ],
      [
        600,
        0.0001247
      ],
      [
        700,
        0.0001249
      ],
      [
        800,
        0.0001249
      ],
      [
        900,
        0.0001259
      ],
      [
        1000,
        0.0001262
      ]
    ],
    "cpTable": [
      [
        20,
        448
      ],
      [
        100,
        469
      ],
      [
        200,
        498
      ],
      [
        300,
        523
      ],
      [
        400,
        548
      ],
      [
        500,
        578
      ],
      [
        600,
        603
      ],
      [
        700,
        632
      ],
      [
        800,
        657
      ],
      [
        900,
        686
      ],
      [
        1000,
        712
      ]
    ],
    "kTable": [
      [
        20,
        11.2
      ],
      [
        100,
        12.7
      ],
      [
        200,
        14.3
      ],
      [
        300,
        16
      ],
      [
        400,
        17.7
      ],
      [
        500,
        19.5
      ],
      [
        600,
        21
      ],
      [
        700,
        22.8
      ],
      [
        800,
        24.4
      ],
      [
        900,
        26.1
      ],
      [
        1000,
        27.8
      ]
    ],
    "source": "Special Metals Inconel 601 bulletin, Table 3",
    "model": "manufacturer table interpolation",
    "id": "catalog-6",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "304 stainless steel",
    "rhoOhmCm": 0.000072,
    "density": 8000,
    "cp": 500,
    "k": 16.2,
    "jmax": 5000000,
    "rhoAlpha": 0.00094,
    "source": "Mittal Table 1; standardized RT correction",
    "model": "linear ρ(T); Cp,k constant",
    "id": "catalog-7",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "Molybdenum",
    "rhoOhmCm": 0.00000534,
    "density": 10220,
    "cp": 251,
    "k": 138,
    "jmax": 300000,
    "rhoAlpha": 0.0046,
    "source": "NIST resistivity compilation; Mittal Table 1",
    "model": "linear ρ(T); Cp,k constant",
    "id": "catalog-8",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "Tungsten",
    "rhoOhmCm": 0.0000056,
    "density": 19300,
    "cp": 134,
    "k": 164,
    "jmax": 30000000,
    "rhoAlpha": 0.0045,
    "source": "NIST resistivity compilation; Mittal Table 1",
    "model": "linear ρ(T); Cp,k constant",
    "id": "catalog-9",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "Copper",
    "rhoOhmCm": 0.00000168,
    "density": 8960,
    "cp": 385,
    "k": 400,
    "jmax": 10000000,
    "rhoAlpha": 0.00393,
    "source": "NIST recommended data",
    "model": "linear ρ(T); Cp,k constant",
    "id": "catalog-10",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "Aluminum",
    "rhoOhmCm": 0.00000265,
    "density": 2700,
    "cp": 897,
    "k": 237,
    "jmax": 5000000000,
    "rhoAlpha": 0.00429,
    "source": "NIST recommended data",
    "model": "linear ρ(T); Cp,k constant",
    "id": "catalog-11",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "name": "Titanium",
    "rhoOhmCm": 0.000042,
    "density": 4500,
    "cp": 523,
    "k": 17,
    "jmax": 4500000,
    "rhoAlpha": 0.0038,
    "source": "Mittal Table 1; RT correction",
    "model": "linear ρ(T); Cp,k constant",
    "id": "catalog-12",
    "referenceC": 20,
    "status": "Transcribed catalog values; cited primary data not independently checked here.",
    "url": "https://github.com/robin-yk/Electrification-Suite/blob/main/apps/joule/solver.js"
  },
  {
    "id": "SiC",
    "name": "SiC | legacy example",
    "rhoOhmCm": 0.01,
    "k": 120,
    "density": 3210,
    "cp": 750,
    "referenceC": 25,
    "model": "Constant illustrative properties",
    "source": "Original Joule3D example",
    "status": "No grade-specific primary source; retained to reproduce earlier settings.",
    "url": ""
  },
  {
    "id": "TiO2",
    "name": "TiO2 | legacy example",
    "rhoOhmCm": 0.1,
    "k": 8,
    "density": 4230,
    "cp": 690,
    "referenceC": 25,
    "model": "Constant illustrative properties",
    "source": "Original Joule3D example",
    "status": "No grade-specific primary source; retained to reproduce earlier settings.",
    "url": ""
  },
  {
    "id": "Fe",
    "name": "Iron | legacy example",
    "rhoOhmCm": 0.000009999999999999999,
    "k": 80,
    "density": 7874,
    "cp": 449,
    "referenceC": 25,
    "model": "Constant illustrative properties",
    "source": "Original Joule3D example",
    "status": "No grade-specific primary source; retained to reproduce earlier settings.",
    "url": ""
  },
  {
    "id": "C",
    "name": "Graphite | legacy example",
    "rhoOhmCm": 0.0007999999999999999,
    "k": 25,
    "density": 2200,
    "cp": 710,
    "referenceC": 25,
    "model": "Constant illustrative properties",
    "source": "Original Joule3D example",
    "status": "No grade-specific primary source; retained to reproduce earlier settings.",
    "url": ""
  }
];
function materialPresetValues(m){
 const a=m.rhoAlpha||0,shift=25-m.referenceC,rho=m.rhoOhmCm*.01;
 return {rho:rho*(1+a*shift),alpha:a/(1+a*shift),k:m.k,cp:m.cp,density:m.density,rhoCurve:(m.rhoTable||m.rhoFactor?.map(([t,f])=>[t,m.rhoOhmCm*f])||[]).map(([t,v])=>[t,v*.01]),kCurve:m.kTable||[],cpCurve:m.cpTable||[]};
}
if(typeof module!=='undefined')module.exports={materialCatalog,materialPresetValues};
