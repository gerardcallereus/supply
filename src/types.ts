export type Language = 'ca' | 'es';

export type NodeType = 'GENERATOR' | 'CONSUMER' | 'SUBSTATION';

export type GeneratorType = 
  | 'NUCLEAR'         // Constant 24h, 0 CO2, high output
  | 'SOLAR'           // Generates 08:00 - 19:00, 0 CO2
  | 'WIND'            // Variable with windSpeed, 0 CO2
  | 'HYDRO_PUMP'      // Pumped hydro storage (Pirineus): absorbs excess, releases on deficit
  | 'GAS_COMBINED'    // Interactive ON/OFF, fossil fuel, generates CO2 emissions
  | 'BIOMASS';        // Biomassa forestal & biogàs agrícola: 24h gestionable, 100% renovable, 0 CO2 fòssil net

export type ConsumerType =
  | 'RESIDENTIAL'     // Low at night, morning peak (08:00), evening peak (19:00-22:00)
  | 'INDUSTRIAL'      // High constant demand 24h
  | 'CRITICAL';       // Hospital / Airport, half failure timer

export type LineVoltage = 'MAT' | 'DISTRIBUTION';
export type ToolMode = 'MAT' | 'DISTRIBUTION' | 'BATTERY' | 'DELETE';

export interface EnergySourceStats {
  type: GeneratorType;
  name: string;
  icon: string;
  mw: number;
  pct: number;
  color: string;
}

export interface GenerationBreakdown {
  nuclearMW: number;
  solarMW: number;
  windMW: number;
  hydroMW: number;
  gasMW: number;
  biomassMW?: number;
  sources: EnergySourceStats[];
  leader: EnergySourceStats | null;
}

export interface Point {
  x: number;
  y: number;
}

export interface EnergyPacket {
  id: string;
  lineId: string;
  sourceType: GeneratorType;
  voltage: LineVoltage;
  fromNodeId: string;
  toNodeId: string;
  segmentIndex: number;
  t: number; // 0.0 to 1.0 along the segment
  speed: number;
  dissipated?: boolean; // Joule dissipation animation
}

export interface SparkParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1.0 down to 0
  color: string;
  size: number;
  type: 'JOULE' | 'OVERLOAD' | 'CONVERTER' | 'ABSORB';
}

export interface GridNode {
  id: string;
  name: string;
  comarca: string;
  pos: Point;
  type: NodeType;
  generatorType?: GeneratorType;
  consumerType?: ConsumerType;
  
  // Power specs (in MW)
  nominalPower: number; 
  currentPower: number;
  
  // Generator & Substation queues (gradual accumulation of energy packets)
  generationQueue?: number;    // Packets accumulated and ready to dispatch
  maxGenerationQueue?: number; // Maximum buffer
  substationPacketSources?: GeneratorType[]; // FIFO queue of original energy sources passing through this substation
  hydroPumpingLoadMW?: number; // Active MW consumed when reversible hydro is pumping water uphill
  
  // Consumer state (gradual accumulation of demand slots)
  demandSlots: number;         // 0 to 8 unfulfilled demand slots
  maxDemandSlots: number;      // Usually 8
  overloadTimer: number;       // Countdown seconds until blackout (15s normal, 7.5s critical)
  maxOverloadTime: number;     // 15s or 7.5s
  isCriticalAlarm: boolean;
  
  // Generator state
  throttle?: number;           // 0.0 to 1.0 (power output throttle slider for any generator)
  isGasActive?: boolean;       // Switch for Gas Combined Cycle plant
  gasThrottle?: number;        // backwards compatibility for gas
  hydroStorage?: number;       // 0 to 100% water storage for reversible hydro
  hydroMode?: HydroMode;       // Active control mode for Reversible Hydro (AUTO, PUMPING, TURBINING, TURBO)
  
  // Upgrades installed on this node
  hasBattery?: boolean;
  batteryCount?: number;       // Number of BESS battery containers installed (0 to 6 at Substations, 0 to 2 at Consumers)
  batteryStorage?: number;     // 0 to 100% (Grid-Scale lithium battery charge)
  batteryMode?: 'CHARGING' | 'DISCHARGING' | 'IDLE';
  hasSmartMetering?: boolean;  // Reduces peak demand by 30% (Comptadors intel·ligents per estalvi a les llars)
  hasRooftopSolar?: boolean;   // Autoconsum solar a les teulades d'edificis (-30% demanda solar diürna)
  hasThermalInsulation?: boolean; // Aïllament tèrmic Passivhaus (-20% consum continu, +15s inèrcia tèrmica)
  hasEcoFilters?: boolean;     // Filtres i electrificació verda (-70% emissions de CO₂ industrial)
  hasHospitalMicrogrid?: boolean; // Microxarxa SAI d'emergència per a hospitals/aeroports (45s protecció)
  hasAutoFrequencyRegulation?: boolean; // Regulador Automàtic AGC: ajusta la potència per clavar la freqüència a 50 Hz
  hasSolarTrackers?: boolean;      // SOLAR: Seguidors solars a 1 eix (+25% matí/tarda)
  hasLowWindBlades?: boolean;      // WIND: Pales de baix vent (+35% brisa suau)
  hasHydroPeltonUpgrade?: boolean; // HYDRO: Turbines Pelton sobredimensionades (+30% MW pic)
  hasGasHydrogenMix?: boolean;     // GAS: Hibridació amb Hidrogen Verd (-40% CO2)
  hasNuclearUprate?: boolean;      // NUCLEAR: Uprate tèrmic (+15% potència base)
  hasBiomassGasifier?: boolean;    // BIOMASSA: Gasificador d'alta eficiència i cogeneració (+20% MW)
  hasV2G?: boolean;                // RESIDENTIAL: Carregadors bidireccionals Vehicle-to-Grid
  hasSmartLED?: boolean;           // RESIDENTIAL: Enllumenat públic LED intel·ligent (-15% consum nit)
  hasHeatRecovery?: boolean;       // INDUSTRIAL: Recuperació de calor i cogeneració (-18% consum)
  hasGreenHydrogen100?: boolean;   // GAS: Reconversió total 100% Hidrogen Verd / Biometà (0 g CO2)
  hasPortElectrification?: boolean; // INDUSTRIAL/PORT: Cold Ironing i electrificació ferroviària (-30% consum i 0 CO2)
  
  // Industrial demand response (Interrompibilitat) & Outages
  isInterrupted?: boolean;     // Industrial demand response: shed load temporarily
  isMaintenanceOutage?: boolean; // Nuclear/thermal scheduled maintenance (30s)
  maintenanceTimer?: number;
}

export type HydroMode = 'AUTO' | 'PUMPING' | 'TURBINING' | 'TURBO';

export type GridEventType = 'HEAT_WAVE' | 'WIND_CALM' | 'TRAMUNTANA_STORM' | 'PEAK_INDUSTRY';

export interface ActiveGridEvent {
  type: GridEventType;
  title: string;
  description: string;
  icon: string;
  remainingSec: number;
  totalSec: number;
}

export interface LevelMission {
  id: string;
  level: number;
  title: string;
  description: string;
  completed: boolean;
  progressText: string;
  rewardEuros: number;
}

export type GameDifficulty = 'AULA' | 'OPERADOR';

export interface InterconnectionState {
  enabled: boolean;
  flowMW: number;              // Positive = importing from France, Negative = exporting to France
  priceEurMWh: number;        // Marginal hourly market spot price (20€ - 160€)
}

export type MarketItemType =
  | 'BUY_BATTERY'
  | 'BUY_MAT_KM'
  | 'BUY_DIST_KM'
  | 'BUY_REINFORCE'
  | 'BUY_SMART_METER'
  | 'BUY_ROOFTOP_SOLAR'
  | 'BUY_INSULATION'
  | 'BUY_ECO_FILTERS'
  | 'BUY_HOSPITAL_SAI'
  | 'INTERCONN_EXPORT'
  | 'INTERCONN_IMPORT';

export interface PowerLine {
  id: string;
  voltage: LineVoltage;
  nodeIds: string[];
  color: string;
  isReinforced: boolean;      // Cable més gruixut: suporta el doble de potència (x2)
  maxCapacity: number;        // Max simultaneous packets allowed
  currentPacketsCount: number;
  isTripped: boolean;         // Thermal circuit breaker tripped (inactive for 5s)
  tripTimer: number;          // Countdown in seconds
  lengthKm: number;           // Real length in kilometers
  pulsePhase: number;
}

export interface WeatherState {
  windSpeed: number;          // km/h (0 to 100)
  windDirectionDeg: number;   // 0 to 360
  solarIntensity: number;     // 0.0 to 1.0 (peaks at 13:00)
  cloudCover: number;         // 0 to 1
}

export interface GameTelemetry {
  gameTimeSec: number;        // Total real simulation seconds
  dayTimeHours: number;       // 0.0 to 24.0
  dayCount: number;           // 1 to N
  dayOfWeek: number;          // 0 = Monday, 6 = Sunday
  
  gridFrequency: number;      // Target 50.00 Hz
  totalGenerationMW: number;
  totalDemandMW: number;
  renewablePercentage: number;
  
  co2EmissionsAccumulated: number; // kg or g of CO2
  co2MaxLimit: number;
  co2Intensity: number;       // g CO2 / kWh
  
  scoreMWhDelivered: number;
  curtailedEnergyMWh: number;  // Surplus energy lost/dumped due to lack of batteries
  budgetEuros: number;         // Economic budget in k€ (thousands of euros)
  netCashflowPerSec?: number;  // Rolling net economic cashflow in k€/s
  etsPenaltyEuros: number;     // Cumulative ETS CO2 penalty in k€
  marketPriceEurMWh: number;   // Dynamic market price in €/MWh
  interconnFlowMW: number;     // Import (+) / Export (-) with France MAT
  overFreqTimer: number;       // Countdown seconds until overfrequency trip
  co2GraceTimer?: number;      // Decontamination protocol countdown (seconds) when CO2 exceeds ceiling
  blackoutRiskNodeId: string | null;
  co2AlertLevel: 'OPTIMAL' | 'PREVENTIVE' | 'EPISODE' | 'EMERGENCY';
  generationBreakdown?: GenerationBreakdown;
  activeEvent?: ActiveGridEvent | null;
  missions?: LevelMission[];
  difficulty: GameDifficulty;
  lastNotification?: { text: string; isError: boolean; timer: number } | null;
}

export type NodeUpgradeType =
  | 'ROOFTOP_SOLAR'
  | 'INSULATION'
  | 'ECO_FILTERS'
  | 'HOSPITAL_SAI'
  | 'SMART_METER'
  | 'BATTERY'
  | 'AUTO_FREQUENCY_AGC'
  | 'SOLAR_TRACKERS'
  | 'WIND_LOW_SPEED'
  | 'HYDRO_PELTON'
  | 'GAS_HYDROGEN'
  | 'NUCLEAR_UPRATE'
  | 'BIOMASS_GASIFIER'
  | 'V2G_CHARGING'
  | 'SMART_LED'
  | 'HEAT_RECOVERY'
  | 'GAS_GREEN_H2_100'
  | 'PORT_ELECTRIFICATION';

export interface Inventory {
  matKmTotal: number;
  matKmUsed: number;
  distKmTotal: number;
  distKmUsed: number;
  batteriesTotal: number;
  batteriesUsed: number;
  reinforcedLinesTotal: number;
  smartMeteringTotal: number;
}

export type UpgradeType =
  | 'NEW_MAT_LINE'
  | 'BATTERY'
  | 'REINFORCED_LINE'
  | 'NEW_DIST_LINE'
  | 'SMART_METERING';

export interface LevelInfo {
  level: number;
  name: string;
  targetDay: number;
  camera: { targetX: number; targetY: number; zoom: number };
  nodeIds: string[];
  description: string;
}

export type GameOverReason = 'BLACKOUT' | 'CLIMATE_EMERGENCY' | 'OVERFREQUENCY' | 'VICTORY';

export interface GameOverState {
  isOver: boolean;
  reason: GameOverReason | null;
  isVictory?: boolean;
  culpritNodeId?: string;
  explanationKey: string;
  stats: {
    daysSurvived: number;
    mwhDelivered: number;
    renewableAvg: number;
    peakFrequencyDeviation: number;
    co2Emitted: number;
  };
}

export interface InteractionState {
  isDragging: boolean;
  dragMode: 'DRAW_LINE' | 'MOVE_CAMERA' | 'APPLY_BATTERY' | 'APPLY_REINFORCE' | 'APPLY_SMART_METER';
  selectedVoltage: LineVoltage;
  dragStartNodeId: string | null;
  dragCurrentWorldPos: Point | null;
  hoverNodeId: string | null;
  hoverLineId: string | null;
  selectedLineId: string | null;
}
