import { GridNode, Point } from "../types";

export interface RiverData {
  id: string;
  name: string;
  points: Point[];
  width: number;
}

export interface MountainBarrier {
  id: string;
  name: string;
  peaks: { name: string; pos: Point; height: number }[];
}

export const MAP_BASE_WIDTH = 1600;
export const MAP_BASE_HEIGHT = 1200;

export const CATALUNYA_RIVERS: RiverData[] = [
  {
    "id": "river-ebre",
    "name": "Riu Ebre",
    "width": 8,
    "points": [
      {
        "x": 334,
        "y": 779
      },
      {
        "x": 369,
        "y": 803
      },
      {
        "x": 393,
        "y": 816
      },
      {
        "x": 407,
        "y": 863
      },
      {
        "x": 400,
        "y": 890
      },
      {
        "x": 379,
        "y": 951
      },
      {
        "x": 376,
        "y": 997
      },
      {
        "x": 396,
        "y": 1043
      },
      {
        "x": 445,
        "y": 1043
      },
      {
        "x": 493,
        "y": 1038
      }
    ]
  },
  {
    "id": "river-segre",
    "name": "Riu Segre & Cinca",
    "width": 6,
    "points": [
      {
        "x": 862,
        "y": 248
      },
      {
        "x": 700,
        "y": 280
      },
      {
        "x": 645,
        "y": 419
      },
      {
        "x": 603,
        "y": 484
      },
      {
        "x": 472,
        "y": 544
      },
      {
        "x": 410,
        "y": 622
      },
      {
        "x": 362,
        "y": 678
      },
      {
        "x": 303,
        "y": 738
      }
    ]
  },
  {
    "id": "river-llobregat",
    "name": "Riu Llobregat & Cardener",
    "width": 6,
    "points": [
      {
        "x": 886,
        "y": 317
      },
      {
        "x": 835,
        "y": 401
      },
      {
        "x": 845,
        "y": 507
      },
      {
        "x": 828,
        "y": 576
      },
      {
        "x": 831,
        "y": 627
      },
      {
        "x": 852,
        "y": 687
      },
      {
        "x": 897,
        "y": 743
      },
      {
        "x": 928,
        "y": 770
      }
    ]
  },
  {
    "id": "river-ter",
    "name": "Riu Ter",
    "width": 6,
    "points": [
      {
        "x": 976,
        "y": 253
      },
      {
        "x": 952,
        "y": 354
      },
      {
        "x": 983,
        "y": 451
      },
      {
        "x": 1066,
        "y": 456
      },
      {
        "x": 1111,
        "y": 465
      },
      {
        "x": 1169,
        "y": 456
      },
      {
        "x": 1273,
        "y": 428
      },
      {
        "x": 1300,
        "y": 437
      }
    ]
  }
];

export const PYRENEES_BARRIER: MountainBarrier = {
  id: "pyrenees",
  name: "Serralada dels Pirineus",
  peaks: [
    { name: "Pica d'Estats", pos: { x: 550, y: 160 }, height: 3143 },
    { name: "Puigmal", pos: { x: 910, y: 195 }, height: 2910 },
    { name: "Canigó", pos: { x: 1080, y: 200 }, height: 2784 },
    { name: "Montseny (Turó de l'Home)", pos: { x: 1080, y: 640 }, height: 1706 },
    { name: "Montserrat (Sant Jeroni)", pos: { x: 890, y: 695 }, height: 1236 },
    { name: "Mont Caro (Ports de Beseit)", pos: { x: 375, y: 1060 }, height: 1441 },
  ]
};

export const ALL_GRID_NODES: GridNode[] = [
  {
    id: "gen-nuclear-asco",
    name: "CN Ascó I i II",
    comarca: "Ribera d'Ebre",
    pos: { x: 393, y: 816 },
    type: "GENERATOR",
    generatorType: "NUCLEAR",
    
    nominalPower: 2060,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    
    
  },
  {
    id: "gen-nuclear-vandellos",
    name: "CN Vandellòs II",
    comarca: "Baix Camp",
    pos: { x: 500, y: 943 },
    type: "GENERATOR",
    generatorType: "NUCLEAR",
    
    nominalPower: 1080,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    
    
  },
  {
    id: "gen-solar-ponent",
    name: "Horta Solar de Ponent",
    comarca: "Segrià",
    pos: { x: 317, y: 608 },
    type: "GENERATOR",
    generatorType: "SOLAR",
    
    nominalPower: 850,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    
    
  },
  {
    id: "gen-solar-garrigues",
    name: "Parc Solar de les Garrigues",
    comarca: "Les Garrigues",
    pos: { x: 507, y: 669 },
    type: "GENERATOR",
    generatorType: "SOLAR",
    
    nominalPower: 500,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
  },
  {
    id: "gen-solar-metropolita",
    name: "Parc Solar del Baix Llobregat",
    comarca: "Baix Llobregat",
    pos: { x: 835, y: 755 },
    type: "GENERATOR",
    generatorType: "SOLAR",
    
    nominalPower: 650,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 2, maxGenerationQueue: 6,
  },
  {
    id: "gen-wind-terra-alta",
    name: "Parc Eòlic Terra Alta",
    comarca: "Terra Alta",
    pos: { x: 300, y: 886 },
    type: "GENERATOR",
    generatorType: "WIND",
    
    nominalPower: 700,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    
    
  },
  {
    id: "gen-wind-emporda",
    name: "Parc Eòlic de l'Albera",
    comarca: "Alt Empordà",
    pos: { x: 1235, y: 195 },
    type: "GENERATOR",
    generatorType: "WIND",
    
    nominalPower: 650,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    
    
  },
  {
    id: "gen-wind-tallat",
    name: "Parc Eòlic Serra del Tallat",
    comarca: "Urgell / Conca de Barberà",
    pos: { x: 603, y: 687 },
    type: "GENERATOR",
    generatorType: "WIND",
    
    nominalPower: 400,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    
    
  },
  {
    id: "gen-hydro-pallars",
    name: "CHR Sallente - Estany Gento",
    comarca: "Pallars Jussà (Vall Fosca)",
    pos: { x: 541, y: 225 },
    type: "GENERATOR",
    generatorType: "HYDRO_PUMP",
    
    nominalPower: 460,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    hydroStorage: 75,
    
  },
  {
    id: "gen-hydro-susqueda",
    name: "CH Sau - Susqueda",
    comarca: "La Selva / Osona",
    pos: { x: 1061, y: 460 },
    type: "GENERATOR",
    generatorType: "HYDRO_PUMP",
    
    nominalPower: 380,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    hydroStorage: 75,
    
  },
  {
    id: "gen-gas-besos",
    name: "CC del Besòs (Gas)",
    comarca: "Barcelonès",
    pos: { x: 999, y: 704 },
    type: "GENERATOR",
    generatorType: "GAS_COMBINED",
    
    nominalPower: 860,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 2, maxGenerationQueue: 6,
    
    isGasActive: true,
  },
  {
    id: "gen-gas-tarragona",
    name: "CC Port de Tarragona",
    comarca: "Tarragonès",
    pos: { x: 622, y: 898 },
    type: "GENERATOR",
    generatorType: "GAS_COMBINED",
    
    nominalPower: 400,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1, maxGenerationQueue: 6,
    
    
    isGasActive: false,
  },
  {
    id: "sub-rubi-canjardi",
    name: "SE Can Jardí (Rubí)",
    comarca: "Vallès Occidental",
    pos: { x: 882, y: 691 },
    type: "SUBSTATION",
    
    
    nominalPower: 3000,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    generationQueue: 0, maxGenerationQueue: 8,
    
    
  },
  {
    id: "sub-sentmenat",
    name: "SE Sentmenat (MAT França)",
    comarca: "Vallès Occidental",
    pos: { x: 954, y: 606 },
    type: "SUBSTATION",
    
    
    nominalPower: 2500,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    generationQueue: 0, maxGenerationQueue: 8,
    
    
  },
  {
    id: "sub-begues",
    name: "SE Begues",
    comarca: "Baix Llobregat",
    pos: { x: 770, y: 760 },
    type: "SUBSTATION",
    
    
    nominalPower: 2000,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    generationQueue: 0, maxGenerationQueue: 8,
    
    
  },
  {
    id: "sub-mangraners",
    name: "SE Mangraners (Lleida)",
    comarca: "Segrià",
    pos: { x: 443, y: 654 },
    type: "SUBSTATION",
    
    
    nominalPower: 1500,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    generationQueue: 0, maxGenerationQueue: 8,
    
    
  },
  {
    id: "sub-vic",
    name: "SE Vic",
    comarca: "Osona",
    pos: { x: 935, y: 510 },
    type: "SUBSTATION",
    
    
    nominalPower: 1800,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    generationQueue: 0, maxGenerationQueue: 8,
    
    
  },
  {
    id: "sub-bescano",
    name: "SE Bescanó (Girona)",
    comarca: "Gironès",
    pos: { x: 1123, y: 475 },
    type: "SUBSTATION",
    
    
    nominalPower: 1600,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    generationQueue: 0, maxGenerationQueue: 8,
    
    
  },
  {
    id: "sub-vandellos-hub",
    name: "SE Vandellòs Hub",
    comarca: "Baix Camp",
    pos: { x: 474, y: 884 },
    type: "SUBSTATION",
    
    
    nominalPower: 2200,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    generationQueue: 0, maxGenerationQueue: 8,
    
    
  },
  {
    id: "cons-barcelona",
    name: "Barcelona Ciutat",
    comarca: "Barcelonès",
    pos: { x: 942, y: 734 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 680,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-valles-ciutats",
    name: "Sabadell - Terrassa",
    comarca: "Vallès Occidental",
    pos: { x: 895, y: 629 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 480,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-lleida",
    name: "Lleida Ciutat",
    comarca: "Segrià",
    pos: { x: 398, y: 609 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 420,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-girona",
    name: "Girona Ciutat",
    comarca: "Gironès",
    pos: { x: 1183, y: 452 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 450,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-tarragona-ciutat",
    name: "Tarragona Ciutat",
    comarca: "Tarragonès",
    pos: { x: 668, y: 835 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 360,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-reus",
    name: "Reus",
    comarca: "Baix Camp",
    pos: { x: 542, y: 825 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 300,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-manresa",
    name: "Manresa",
    comarca: "Bages",
    pos: { x: 826, y: 572 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 300,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-mataro",
    name: "Mataró",
    comarca: "Maresme",
    pos: { x: 1042, y: 657 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 350,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-tortosa",
    name: "Tortosa",
    comarca: "Baix Ebre",
    pos: { x: 376, y: 996 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 250,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-figueres",
    name: "Figueres",
    comarca: "Alt Empordà",
    pos: { x: 1218, y: 324 },
    type: "CONSUMER",
    
    consumerType: "RESIDENTIAL",
    nominalPower: 250,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-petroquimic",
    name: "Polígon Petroquímic",
    comarca: "Tarragonès",
    pos: { x: 605, y: 837 },
    type: "CONSUMER",
    
    consumerType: "INDUSTRIAL",
    nominalPower: 750,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-zona-franca",
    name: "Port de Barcelona & Zona Franca",
    comarca: "Barcelonès",
    pos: { x: 954, y: 796 },
    type: "CONSUMER",
    consumerType: "INDUSTRIAL",
    nominalPower: 550,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
  },
  {
    id: "cons-seat-martorell",
    name: "SEAT Martorell",
    comarca: "Baix Llobregat",
    pos: { x: 819, y: 687 },
    type: "CONSUMER",
    
    consumerType: "INDUSTRIAL",
    nominalPower: 480,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-hospital-vallhebron",
    name: "Hospital Vall d'Hebron",
    comarca: "Barcelonès",
    pos: { x: 943, y: 671 },
    type: "CONSUMER",
    
    consumerType: "CRITICAL",
    nominalPower: 200,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 22,
    maxOverloadTime: 22,
    isCriticalAlarm: false,
    
    
    
    
  },
  {
    id: "cons-aeroport-elprat",
    name: "Aeroport El Prat",
    comarca: "Baix Llobregat",
    pos: { x: 890, y: 795 },
    type: "CONSUMER",
    
    consumerType: "CRITICAL",
    nominalPower: 300,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 22,
    maxOverloadTime: 22,
    isCriticalAlarm: false,
  },
  {
    id: "gen-hydro-aran",
    name: "CH Cledes - Val d'Aran",
    comarca: "Val d'Aran",
    pos: { x: 470, y: 135 },
    type: "GENERATOR",
    generatorType: "HYDRO_PUMP",
    nominalPower: 220,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1,
    maxGenerationQueue: 6,
    hydroStorage: 80,
  },
  {
    id: "sub-la-pobla-segur",
    name: "SE La Pobla de Segur",
    comarca: "Pallars Jussà",
    pos: { x: 535, y: 310 },
    type: "SUBSTATION",
    nominalPower: 1400,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 0,
    maxGenerationQueue: 8,
  },
  {
    id: "cons-seu-urgell",
    name: "La Seu d'Urgell",
    comarca: "Alt Urgell",
    pos: { x: 675, y: 320 },
    type: "CONSUMER",
    consumerType: "RESIDENTIAL",
    nominalPower: 180,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
  },
  {
    id: "cons-puigcerda",
    name: "Puigcerdà",
    comarca: "Cerdanya",
    pos: { x: 835, y: 255 },
    type: "CONSUMER",
    consumerType: "RESIDENTIAL",
    nominalPower: 150,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
  },
  {
    id: "sub-ebre-tortosa",
    name: "SE Terres de l'Ebre",
    comarca: "Baix Ebre",
    pos: { x: 385, y: 940 },
    type: "SUBSTATION",
    nominalPower: 1800,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 0,
    maxGenerationQueue: 8,
  },
  {
    id: "cons-amposta-delta",
    name: "Amposta & Delta de l'Ebre",
    comarca: "Montsià",
    pos: { x: 410, y: 1055 },
    type: "CONSUMER",
    consumerType: "RESIDENTIAL",
    nominalPower: 220,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
  },
  {
    id: "cons-vic",
    name: "Vic",
    comarca: "Osona",
    pos: { x: 1005, y: 450 },
    type: "CONSUMER",
    consumerType: "RESIDENTIAL",
    nominalPower: 260,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
  },
  {
    id: "cons-olot",
    name: "Olot",
    comarca: "Garrotxa",
    pos: { x: 1080, y: 350 },
    type: "CONSUMER",
    consumerType: "INDUSTRIAL",
    nominalPower: 240,
    currentPower: 0,
    demandSlots: 1,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
  },
  {
    id: "sub-figueres-franca",
    name: "SE Santa Llogaia (MAT França)",
    comarca: "Alt Empordà",
    pos: { x: 1180, y: 350 },
    type: "SUBSTATION",
    nominalPower: 2500,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 0,
    maxGenerationQueue: 8,
  },
  {
    id: "gen-wind-offshore-roses",
    name: "Eòlica Marina Flotant (Golf de Roses)",
    comarca: "Alt Empordà",
    pos: { x: 1290, y: 310 },
    type: "GENERATOR",
    generatorType: "WIND",
    nominalPower: 850,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1,
    maxGenerationQueue: 6,
  },
  {
    id: "gen-biomass-osona",
    name: "Central de Biomassa Osona-Montseny",
    comarca: "Osona",
    pos: { x: 965, y: 430 },
    type: "GENERATOR",
    generatorType: "BIOMASS",
    nominalPower: 180,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1,
    maxGenerationQueue: 6,
  },
  {
    id: "gen-biomass-garrotxa",
    name: "Planta de Biogàs & Biomassa Garrotxa",
    comarca: "Garrotxa",
    pos: { x: 1040, y: 380 },
    type: "GENERATOR",
    generatorType: "BIOMASS",
    nominalPower: 240,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
    generationQueue: 1,
    maxGenerationQueue: 6,
  },
  {
    id: "cons-vielha-aran",
    name: "Vielha e Mijaran",
    comarca: "Val d'Aran",
    pos: { x: 440, y: 220 },
    type: "CONSUMER",
    consumerType: "RESIDENTIAL",
    nominalPower: 180,
    currentPower: 0,
    demandSlots: 0,
    maxDemandSlots: 8,
    overloadTimer: 35,
    maxOverloadTime: 35,
    isCriticalAlarm: false,
  }
];
