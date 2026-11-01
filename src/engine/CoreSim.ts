import { 
  GridNode, 
  PowerLine, 
  EnergyPacket, 
  SparkParticle, 
  GameTelemetry, 
  Inventory, 
  GameOverState, 
  WeatherState, 
  LineVoltage, 
  Point, 
  UpgradeType,
  GeneratorType,
  LevelInfo,
  EnergySourceStats,
  GenerationBreakdown,
  HydroMode,
  GridEventType,
  ActiveGridEvent,
  LevelMission,
  MarketItemType,
  GameDifficulty,
  GameOverReason,
  NodeUpgradeType
} from '../types';
import { CONFIG } from '../constants';
import { 
  ALL_GRID_NODES, 
  CATALUNYA_RIVERS 
} from '../utils/catalunyaGeography';
import { 
  dist, 
  countLinePolylineIntersections 
} from '../utils/geometry';

export interface LineCreationResult {
  success: boolean;
  error?: string;
  message?: string;
}

// 4 Progressive levels of increasing scale and geographic scope across Catalonia
export const GAME_LEVELS: LevelInfo[] = [
  {
    level: 1,
    name: "Nivell 1: Àrea Metropolitana i Central (El Cor Urbà)",
    targetDay: 1,
    camera: { targetX: 920, targetY: 712, zoom: 2.3 },
    nodeIds: [
      'gen-solar-metropolita',
      'gen-gas-besos',
      'sub-rubi-canjardi',
      'cons-barcelona',
      'cons-hospital-vallhebron',
      'cons-valles-ciutats',
    ],
    description: "Comença la xarxa! Enllaça el Parc Solar del Baix Llobregat i el CC del Besòs amb la Subestació de Can Jardí (MAT 400 kV) i distribueix electricitat (25 kV) a Barcelona, Sabadell-Terrassa i l'Hospital de la Vall d'Hebron.",
  },
  {
    level: 2,
    name: "Nivell 2: Terres de l'Ebre i Camp de Tarragona (L'Eix Sud)",
    targetDay: 3,
    camera: { targetX: 680, targetY: 820, zoom: 1.10 },
    nodeIds: [
      'gen-nuclear-asco',
      'gen-nuclear-vandellos',
      'gen-wind-terra-alta',
      'gen-gas-tarragona',
      'sub-vandellos-hub',
      'sub-ebre-tortosa',
      'sub-begues',
      'cons-tortosa',
      'cons-amposta-delta',
      'cons-tarragona-ciutat',
      'cons-reus',
      'cons-petroquimic',
      'cons-zona-franca',
      'cons-aeroport-elprat',
    ],
    description: "L'eix energètic del sud! Entren les centrals nuclears d'Ascó i Vandellòs (3.140 MW), el parc eòlic de la Terra Alta i el CC de Tarragona. Connecta les subestacions de Terres de l'Ebre, Vandellòs Hub i Begues per abastir Tortosa, el Delta, Reus, Tarragona, el gran Polígon Petroquímic, el Port de Barcelona i l'Aeroport del Prat.",
  },
  {
    level: 3,
    name: "Nivell 3: Ponent, Pirineus Occidentals i Catalunya Central",
    targetDay: 5,
    camera: { targetX: 580, targetY: 420, zoom: 1.10 },
    nodeIds: [
      'gen-solar-ponent',
      'gen-solar-garrigues',
      'gen-wind-tallat',
      'gen-hydro-pallars',
      'gen-hydro-aran',
      'sub-mangraners',
      'sub-la-pobla-segur',
      'cons-lleida',
      'cons-seu-urgell',
      'cons-puigcerda',
      'cons-manresa',
      'cons-seat-martorell',
      'sub-sentmenat',
    ],
    description: "Transició renovable i alta muntanya! S'incorporen l'Horta Solar de Ponent, l'eòlica del Tallat i les centrals hidroelèctriques de Sallente i Cledes (Aran). Gestiona el bombament d'aigua per emmagatzemar l'excedent solar i proveeix Lleida, La Seu d'Urgell, Puigcerdà, Manresa i SEAT Martorell.",
  },
  {
    level: 4,
    name: "Nivell 4: Xarxa Nacional Completa i Interconnexió MAT França",
    targetDay: 7,
    camera: { targetX: 800, targetY: 600, zoom: 0.82 },
    nodeIds: [
      'gen-wind-emporda',
      'gen-hydro-susqueda',
      'gen-biomass-osona',
      'sub-vic',
      'sub-bescano',
      'sub-figueres-franca',
      'cons-girona',
      'cons-figueres',
      'cons-olot',
      'cons-vic',
      'cons-mataro',
    ],
    description: "Simulació total de Catalunya! S'integren Sau-Susqueda, l'eòlica de l'Albera, la central de biomassa forestal Osona-Montseny i la interconnexió MAT amb França a Santa Llogaia. Connecta totes les regions en una xarxa sincrònica unificada i salva els pics crítics mitjançant el mercat spot internacional i la gestió de demanda.",
  },
  {
    level: 5,
    name: "Nivell 5: Catalunya 2030 - Descarbonització Total i Xarxa Intel·ligent PROENCAT",
    targetDay: 10,
    camera: { targetX: 840, targetY: 570, zoom: 0.72 },
    nodeIds: [
      'gen-wind-offshore-roses',
      'gen-biomass-garrotxa',
      'cons-vielha-aran',
    ],
    description: "L'horitzó PROENCAT 2030! Connecta el gran parc d'eòlica marina flotant del Golf de Roses (850 MW), la planta de biogàs i biomassa de la Garrotxa (240 MW) i abasteix la Val d'Aran. Lidera la transició energètica completa cap a la independència verda, la xarxa intel·ligent i el residu zero de CO₂.",
  }
];

export class CoreSim {
  nodes: GridNode[] = [];
  lines: PowerLine[] = [];
  packets: EnergyPacket[] = [];
  sparks: SparkParticle[] = [];
  
  currentLevel = 1;
  targetCamera = { targetX: 920, targetY: 712, zoom: 3.3 };
  
  levelUpModal: { show: boolean; level: LevelInfo } | null = null;
  notificationMessage: { text: string; isError: boolean; timer: number } | null = null;

  weather: WeatherState = {
    windSpeed: 42,
    windDirectionDeg: 315,
    solarIntensity: 0,
    cloudCover: 0.1,
  };
  
  telemetry: GameTelemetry = {
    gameTimeSec: 0,
    dayTimeHours: 7.5,
    dayCount: 1,
    dayOfWeek: 0,
    gridFrequency: 50.0,
    totalGenerationMW: 860,
    totalDemandMW: 800,
    renewablePercentage: 0,
    co2EmissionsAccumulated: 0,
    co2MaxLimit: CONFIG.INITIAL_CO2_LIMIT_KG,
    co2Intensity: 45,
    scoreMWhDelivered: 0,
    curtailedEnergyMWh: 0,
    budgetEuros: 150,
    etsPenaltyEuros: 0,
    marketPriceEurMWh: 65,
    interconnFlowMW: 0,
    overFreqTimer: 25.0,
    co2GraceTimer: 45.0,
    blackoutRiskNodeId: null,
    co2AlertLevel: 'OPTIMAL',
    activeEvent: null,
    missions: [],
    difficulty: 'OPERADOR',
    lastNotification: null,
  };
  
  inventory: Inventory = {
    matKmTotal: CONFIG.STARTING_MAT_KM,
    matKmUsed: 0,
    distKmTotal: CONFIG.STARTING_DIST_KM,
    distKmUsed: 0,
    batteriesTotal: CONFIG.STARTING_BATTERIES,
    batteriesUsed: 0,
    reinforcedLinesTotal: 0,
    smartMeteringTotal: 0,
  };
  
  gameOver: GameOverState = {
    isOver: false,
    reason: null,
    explanationKey: '',
    stats: {
      daysSurvived: 0,
      mwhDelivered: 0,
      renewableAvg: 0,
      peakFrequencyDeviation: 0,
      co2Emitted: 0,
    }
  };
  
  isPaused: boolean = true;
  speedMultiplier: number = 1.0;
  isWeeklyUpgradePending: boolean = false;
  
  private packetIdCounter = 0;
  private sparkIdCounter = 0;
  private lineIdCounter = 0;
  private weatherTimer = 0;
  private eventCooldownTimer = 30;
  private nodeSpawnTimers: Map<string, number> = new Map();
  private lastDayRecorded = 1;
  private renewableSamples: number[] = [];
  private allMissions: LevelMission[] = [];
  private maintenanceCooldownTimer = 45;
  private stableFreqTimer = 0;
  private internationalTradesCount = 0;
  private frameCashflowEuros = 0;
  private smoothedCashflowPerSec = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.currentLevel = 1;
    this.isPaused = true;
    this.targetCamera = { ...GAME_LEVELS[0].camera };
    this.levelUpModal = null;
    this.notificationMessage = null;

    // Filter nodes for Level 1 only
    const l1Ids = GAME_LEVELS[0].nodeIds;
    this.nodes = JSON.parse(JSON.stringify(ALL_GRID_NODES)).filter(
      (n: GridNode) => l1Ids.includes(n.id)
    );

    // Initial state: Start all power plants at 0 output so the player starts from a clean slate
    for (const n of this.nodes) {
      if (n.type === 'GENERATOR') {
        n.throttle = 0;
        n.currentPower = 0;
        n.generationQueue = 0;
        if (n.generatorType === 'GAS_COMBINED') {
          n.isGasActive = false;
        }
      } else if (n.type === 'CONSUMER') {
        n.demandSlots = 0;
        n.currentPower = 0;
      }
    }

    this.lines = [];
    this.packets = [];
    this.sparks = [];
    this.packetIdCounter = 0;
    this.sparkIdCounter = 0;
    this.lineIdCounter = 0;
    this.weatherTimer = 0;
    this.eventCooldownTimer = 30;
    this.nodeSpawnTimers.clear();
    this.lastDayRecorded = 1;
    this.renewableSamples = [];
    this.initMissions();
    
    // Start paused in design/planning phase to let player wire up the network first
    this.isPaused = true;

    this.weather = {
      windSpeed: 38,
      windDirectionDeg: 315,
      solarIntensity: 0.1,
      cloudCover: 0.1,
    };
    
    this.telemetry = {
      gameTimeSec: 0,
      dayTimeHours: 7.5,
      dayCount: 1,
      dayOfWeek: 0,
      gridFrequency: 50.0,
      totalGenerationMW: 0,
      totalDemandMW: 0,
      renewablePercentage: 0,
      co2EmissionsAccumulated: 0,
      co2MaxLimit: CONFIG.INITIAL_CO2_LIMIT_KG,
      co2Intensity: 45,
      scoreMWhDelivered: 0,
      curtailedEnergyMWh: 0,
      budgetEuros: 150,
      netCashflowPerSec: 0,
      etsPenaltyEuros: 0,
      marketPriceEurMWh: 65,
      interconnFlowMW: 0,
      overFreqTimer: 25.0,
      co2GraceTimer: 45.0,
      blackoutRiskNodeId: null,
      co2AlertLevel: 'OPTIMAL',
      activeEvent: null,
      missions: this.allMissions.filter(m => m.level === 1),
      difficulty: 'OPERADOR',
      lastNotification: null,
    };
    
    this.inventory = {
      matKmTotal: CONFIG.STARTING_MAT_KM,
      matKmUsed: 0,
      distKmTotal: CONFIG.STARTING_DIST_KM,
      distKmUsed: 0,
      batteriesTotal: CONFIG.STARTING_BATTERIES,
      batteriesUsed: 0,
      reinforcedLinesTotal: 0,
      smartMeteringTotal: 0,
    };
    
    this.gameOver = {
      isOver: false,
      reason: null,
      explanationKey: '',
      stats: {
        daysSurvived: 0,
        mwhDelivered: 0,
        renewableAvg: 0,
        peakFrequencyDeviation: 0,
        co2Emitted: 0,
      }
    };
    
    this.isPaused = true;
    this.speedMultiplier = 1.0;
    this.isWeeklyUpgradePending = false;
    this.frameCashflowEuros = 0;
    this.smoothedCashflowPerSec = 0;
  }

  update(deltaSec: number) {
    if (this.isPaused || this.gameOver.isOver || this.isWeeklyUpgradePending || this.levelUpModal?.show) {
      return;
    }

    const effectiveDt = deltaSec * this.speedMultiplier;
    this.telemetry.gameTimeSec += effectiveDt;
    this.frameCashflowEuros = 0;

    if (this.notificationMessage) {
      this.notificationMessage.timer -= deltaSec;
      if (this.notificationMessage.timer <= 0) {
        this.notificationMessage = null;
        this.telemetry.lastNotification = null;
      } else {
        this.telemetry.lastNotification = { ...this.notificationMessage };
      }
    }

    // Cost operatiu de manteniment de la xarxa elèctrica (O&M continu segons línies i centrals actives)
    // Al Nivell 1 el cost d'O&M és 0 per no bloquejar la construcció inicial de l'alumnat
    let omCost = 0;
    if (this.currentLevel > 1) {
      const activeGenCount = this.nodes.filter(n => n.type === 'GENERATOR' && (n.currentPower || 0) > 0).length;
      const baseRate = this.telemetry.difficulty === 'OPERADOR' ? 0.20 : 0.08;
      omCost = (baseRate + this.lines.length * 0.02 + activeGenCount * 0.03) * effectiveDt;
    }
    this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - omCost) * 10) / 10);
    this.frameCashflowEuros -= omCost;

    // Liquidació contínua de la interconnexió MAT amb França (respecta pausa i velocitat)
    if (this.telemetry.interconnFlowMW !== 0) {
      if (!this.isFranceInterconnConnected()) {
        this.telemetry.interconnFlowMW = 0;
      } else if (this.telemetry.interconnFlowMW < 0) {
        // Exportant 300 MW cap a França: ingressos continus segons preu spot
        const exportRev = (this.telemetry.marketPriceEurMWh * 0.035) * effectiveDt;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros + exportRev) * 10) / 10;
        this.frameCashflowEuros += exportRev;
      } else if (this.telemetry.interconnFlowMW > 0) {
        // Important 300 MW des de França: cost continu segons preu spot
        const importCost = (this.telemetry.marketPriceEurMWh * 0.04) * effectiveDt;
        if (this.telemetry.budgetEuros >= importCost) {
          this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - importCost) * 10) / 10);
          this.frameCashflowEuros -= importCost;
        } else {
          this.telemetry.interconnFlowMW = 0;
          this.notify("⚠️ S'ha aturat la importació amb França per falta de pressupost.", true);
        }
      }
    }

    // 1. Advance Day/Night Clock
    const hoursPerSec = 24 / CONFIG.SECONDS_PER_DAY;
    this.telemetry.dayTimeHours += effectiveDt * hoursPerSec;
    
    if (this.telemetry.dayTimeHours >= 24) {
      this.telemetry.dayTimeHours -= 24;
      this.telemetry.dayCount += 1;
      this.telemetry.dayOfWeek = (this.telemetry.dayOfWeek + 1) % 7;
      
      // Check for progressive level unlocks
      this.checkLevelProgression();

      // Fons Europeus NextGenerationEU / Balanç Setmanal (Diumenge) sense interrompre la partida amb modals
      if (this.telemetry.dayOfWeek === 0 && this.telemetry.dayCount > this.lastDayRecorded) {
        this.lastDayRecorded = this.telemetry.dayCount;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros + 55) * 10) / 10;
        this.inventory.matKmTotal += 60;
        this.inventory.distKmTotal += 60;
        this.notify("🇪🇺 Fons NextGenerationEU (Balanç Setmanal): +55 k€ i +60 km de cable MAT/Distribució per a la transició energètica!", false);
      }
    }

    // 2. Weather & Dynamic Climate Events
    this.updateWeather(effectiveDt);
    this.updateDynamicEvents(effectiveDt);

    // 3. Gradual Energy Generation and Accumulation
    this.updateGradualGeneration(effectiveDt);

    // 4. Gradual Demand Slots Accumulation
    this.updateGradualDemand(effectiveDt);

    // 5. Lines Physics
    this.updateLines(effectiveDt);

    // 6. Dispatch packets from queues
    this.dispatchPacketsFromQueues(effectiveDt);

    // 7. Move packets and calculate Joule losses
    this.updatePackets(effectiveDt);

    // 8. Update sparks & storage
    this.updateSparks(effectiveDt);
    this.updateStorage(effectiveDt);

    // 9. Grid frequency & Missions
    this.updateGridFrequency();
    this.updateMissions(effectiveDt);

    // 10. Check defeat conditions
    this.checkDefeatConditions(effectiveDt);

    // 11. Smooth net economic cashflow rate (k€/s)
    if (effectiveDt > 0.001) {
      const instantRate = this.frameCashflowEuros / effectiveDt;
      const alpha = Math.min(1, effectiveDt * 1.5);
      this.smoothedCashflowPerSec = this.smoothedCashflowPerSec * (1 - alpha) + instantRate * alpha;
      this.telemetry.netCashflowPerSec = Math.round(this.smoothedCashflowPerSec * 10) / 10;
    }
  }

  // Check if player completes level missions and has built lines to unlock next levels
  private checkLevelProgression() {
    const currentMissions = this.allMissions.filter(m => m.level === this.currentLevel);
    const allMissionsCompleted = currentMissions.length > 0 && currentMissions.every(m => m.completed);
    const hasBuiltLines = this.lines.length >= 2;

    if (allMissionsCompleted && hasBuiltLines) {
      const nextLevel = GAME_LEVELS.find(lvl => lvl.level === this.currentLevel + 1);
      if (nextLevel) {
        this.advanceToLevel(nextLevel);
      } else if (this.currentLevel === 5 && !this.gameOver.isOver) {
        this.triggerVictory();
      }
    }
  }

  private triggerVictory() {
    this.gameOver = {
      isOver: true,
      reason: 'VICTORY',
      isVictory: true,
      explanationKey: 'victory',
      stats: {
        daysSurvived: this.telemetry.dayCount,
        mwhDelivered: this.telemetry.scoreMWhDelivered,
        renewableAvg: Math.round(this.telemetry.renewablePercentage),
        peakFrequencyDeviation: Math.round(Math.abs(this.telemetry.gridFrequency - 50) * 100) / 100,
        co2Emitted: Math.round(this.telemetry.co2EmissionsAccumulated / 1000),
      }
    };
    this.isPaused = true;
    this.notify("🏆 VICTÒRIA! Catalunya ha assolit la neutralitat climàtica i la sobirania energètica 2030!", false);
  }

  private advanceToLevel(lvl: LevelInfo) {
    this.currentLevel = lvl.level;
    this.targetCamera = { ...lvl.camera };
    this.telemetry.activeEvent = null;
    this.eventCooldownTimer = 25;

    // Grant calibrated expansion bonuses so cable distance matters
    const matBonus = lvl.level === 2 ? 160 : lvl.level === 3 ? 180 : lvl.level === 4 ? 200 : 220;
    const distBonus = lvl.level === 2 ? 110 : lvl.level === 3 ? 130 : lvl.level === 4 ? 140 : 160;
    this.inventory.matKmTotal += matBonus;
    this.inventory.distKmTotal += distBonus;
    this.inventory.batteriesTotal += 1;
    this.telemetry.co2MaxLimit += lvl.level === 2 ? 18000 : lvl.level === 3 ? 24000 : lvl.level === 4 ? 30000 : 35000;

    // Add new nodes for this level
    const existingIds = new Set(this.nodes.map(n => n.id));
    for (const id of lvl.nodeIds) {
      if (!existingIds.has(id)) {
        const fullNode = ALL_GRID_NODES.find(n => n.id === id);
        if (fullNode) {
          const cloned = JSON.parse(JSON.stringify(fullNode));
          // Start newly unlocked consumers with 0 demand slots to give player plenty of time
          cloned.demandSlots = 0;
          cloned.currentPower = 0;
          cloned.overloadTimer = cloned.maxOverloadTime;
          cloned.isCriticalAlarm = false;
          if (cloned.type === 'GENERATOR') {
            cloned.generationQueue = 0;
            cloned.throttle = 0;
            cloned.currentPower = 0;
            if (cloned.generatorType === 'GAS_COMBINED') {
              cloned.isGasActive = false;
            }
          }
          this.nodes.push(cloned);
          this.spawnParticle(cloned.pos.x, cloned.pos.y, '#38BDF8', 'CONVERTER');
        }
      }
    }

    // Pause and show informative Level Up modal
    this.levelUpModal = { show: true, level: lvl };
    this.isPaused = true;
  }

  dismissLevelUp() {
    this.levelUpModal = null;
    this.isPaused = true; // Keep in planning/design phase so the player can lay cables first
  }

  private updateWeather(dt: number) {
    this.weatherTimer += dt;
    const hour = this.telemetry.dayTimeHours;
    if (hour >= 7.5 && hour <= 19.5) {
      const solarPeak = 13.5;
      const normalizedDist = Math.abs(hour - solarPeak) / 6.0;
      let baseSolar = Math.max(0, Math.cos(normalizedDist * Math.PI * 0.5));
      if (this.telemetry.activeEvent?.type === 'HEAT_WAVE') {
        baseSolar = Math.min(1.0, baseSolar * 1.15);
      } else if (this.telemetry.activeEvent?.type === 'TRAMUNTANA_STORM') {
        baseSolar *= 0.45;
      }
      this.weather.solarIntensity = baseSolar;
    } else {
      this.weather.solarIntensity = 0;
    }
    
    if (this.telemetry.activeEvent?.type === 'WIND_CALM') {
      this.weather.windSpeed = Math.max(4, this.weather.windSpeed * 0.92);
    } else if (this.telemetry.activeEvent?.type === 'TRAMUNTANA_STORM') {
      this.weather.windSpeed = Math.min(98, this.weather.windSpeed * 0.85 + 92 * 0.15);
    } else if (this.weatherTimer > 3.5) {
      this.weatherTimer = 0;
      const targetWind = 18 + Math.random() * 62;
      this.weather.windSpeed = this.weather.windSpeed * 0.75 + targetWind * 0.25;
    }
  }

  private initMissions() {
    this.allMissions = [
      // NIVELL 1
      {
        id: 'm1-connect-amb',
        level: 1,
        title: "Enllaç Metropolità (BCN + Vall d'Hebron)",
        description: "Connecta Barcelona Ciutat i l'Hospital Vall d'Hebron a la Subestació de Can Jardí i lliura 300 MWh.",
        completed: false,
        progressText: "0 / 300 MWh",
        rewardEuros: 45,
      },
      {
        id: 'm1-bess-storage',
        level: 1,
        title: "Emmagatzematge Solar BESS",
        description: "Instal·la almenys 2 mòduls de bateria BESS a SE Can Jardí per guardar l'excedent solar del migdia.",
        completed: false,
        progressText: "0 / 2 BESS",
        rewardEuros: 55,
      },
      {
        id: 'm1-freq-stable',
        level: 1,
        title: "Estabilitat Sincrònica dels 50.00 Hz",
        description: "Mantingues la freqüència de la xarxa estable entre 49.90 Hz i 50.10 Hz durant 20 segons continuats.",
        completed: false,
        progressText: "0 / 20 s",
        rewardEuros: 50,
      },
      {
        id: 'm1-hospital-microgrid',
        level: 1,
        title: "Blindatge Hospitalari Crític",
        description: "Instal·la la Microxarxa SAI d'Emergència a l'Hospital Vall d'Hebron per garantir suport vital continu (+45s de marge).",
        completed: false,
        progressText: "Pendent d'instal·lació",
        rewardEuros: 55,
      },
      {
        id: 'm1-rooftop-solar',
        level: 1,
        title: "Eficiència Urbana a Barcelona",
        description: "Instal·la autoconsum solar, aïllament passivhaus o comptadors intel·ligents a Barcelona o ciutats metropolitanes.",
        completed: false,
        progressText: "Pendent de millora",
        rewardEuros: 50,
      },

      // NIVELL 2
      {
        id: 'm2-ebre-hub',
        level: 2,
        title: "Eix Energètic del Sud (Ebre & Tarragona)",
        description: "Enllaça Ascó o Vandellòs amb SE Terres de l'Ebre o Vandellòs Hub per alimentar Tortosa, Reus i el Petroquímic.",
        completed: false,
        progressText: "Pendent d'enllaç",
        rewardEuros: 60,
      },
      {
        id: 'm2-critical-ports',
        level: 2,
        title: "Infraestructures Crítiques Nacionals",
        description: "Connecta el Port de Barcelona & Zona Franca i l'Aeroport del Prat a través de SE Begues i proveeix-los d'energia.",
        completed: false,
        progressText: "Pendent d'abastir",
        rewardEuros: 70,
      },
      {
        id: 'm2-low-carbon',
        level: 2,
        title: "Descarbonització del Camp de Tarragona",
        description: "Assoleix un 75% o més de generació lliure de CO₂ reduint el Cicle Combinat quan entri la Nuclear i Eòlica.",
        completed: false,
        progressText: "En curs",
        rewardEuros: 65,
      },
      {
        id: 'm2-port-cold-ironing',
        level: 2,
        title: "Electrificació Portuària i Logística",
        description: "Instal·la l'Electrificació de Molls (Cold Ironing) a la Zona Franca o filtres verds a la indústria.",
        completed: false,
        progressText: "Pendent d'electrificació",
        rewardEuros: 75,
      },
      {
        id: 'm2-petro-efficiency',
        level: 2,
        title: "Gestió i Descarbonització Petroquímica",
        description: "Instal·la filtres ecològics, recuperació de calor o activa la Interrompibilitat al Polígon Petroquímic de Tarragona.",
        completed: false,
        progressText: "Pendent d'acció industrial",
        rewardEuros: 70,
      },

      // NIVELL 3
      {
        id: 'm3-pyrenees-hydro',
        level: 3,
        title: "Bateria Pirinenca (Sallente / Aran)",
        description: "Bombeja aigua durant les hores d'excedent per assolir una reserva hidràulica del 85% o superior.",
        completed: false,
        progressText: "75% / 85%",
        rewardEuros: 80,
      },
      {
        id: 'm3-zero-curtailment',
        level: 3,
        title: "Aprofitament de Ponent i Lleida",
        description: "Connecta l'Horta Solar de Ponent i Lleida i arriba a 2.500 MWh entregats mantenint les pèrdues sota control.",
        completed: false,
        progressText: "0 / 2.500 MWh",
        rewardEuros: 85,
      },
      {
        id: 'm3-substation-ring',
        level: 3,
        title: "Anella d'Alta Tensió Sincrònica",
        description: "Uneix almenys 3 subestacions diferents entre elles formant una xarxa en anella redundant.",
        completed: false,
        progressText: "0 / 3 enllaços inter-subestació",
        rewardEuros: 90,
      },
      {
        id: 'm3-solar-trackers',
        level: 3,
        title: "Seguidors Solars de doble eix a Ponent",
        description: "Equipa el parc solar de Ponent amb seguidors solars (+25% generació) o millora el grup hidràulic amb Pelton/Francis.",
        completed: false,
        progressText: "Pendent de tecnologia",
        rewardEuros: 75,
      },
      {
        id: 'm3-smart-meters',
        level: 3,
        title: "Xarxa Intel·ligent Smart Grid",
        description: "Desplega comptadors intel·ligents o tecnologia Vehicle-to-Grid (V2G) en un node consumidor de la xarxa.",
        completed: false,
        progressText: "0 / 1 node intel·ligent",
        rewardEuros: 80,
      },

      // NIVELL 4
      {
        id: 'm4-france-interconn',
        level: 4,
        title: "Interconnexió Transfronterera MAT França",
        description: "Connecta la línia MAT 400 kV fins a SE Santa Llogaia / Figueres amb França per obrir el comerç internacional.",
        completed: false,
        progressText: "Pendent d'activació",
        rewardEuros: 100,
      },
      {
        id: 'm4-international-trade',
        level: 4,
        title: "Operador del Mercat Internacional",
        description: "Realitza amb èxit almenys una operació d'exportació o importació estratègica a través de l'enllaç MAT amb França.",
        completed: false,
        progressText: "0 / 1 operació",
        rewardEuros: 110,
      },
      {
        id: 'm4-100-renewables',
        level: 4,
        title: "Catalunya 100% Neta i Descarbonitzada",
        description: "Atura completament els dos Cicles Combinats de Gas (0 MW) abastint més de 2.000 MW exclusivament amb nuclear, aigua, sol i vent.",
        completed: false,
        progressText: "Pendent d'aturada de gas",
        rewardEuros: 120,
      },
      {
        id: 'm4-emporda-wind',
        level: 4,
        title: "Tramuntana de l'Albera i Xarxa Nord",
        description: "Connecta el Parc Eòlic de l'Albera i proveeix Girona i Figueres per assegurar el subministrament septentrional.",
        completed: false,
        progressText: "Pendent de connexió",
        rewardEuros: 105,
      },
      {
        id: 'm4-biomass-wind-tech',
        level: 4,
        title: "Tecnologia Neta: Pales Eòliques o Gasificador",
        description: "Instal·la les Pales de Baixa Velocitat a l'Albera o el Gasificador d'Alta Eficiència a la central de biomassa d'Osona.",
        completed: false,
        progressText: "Pendent d'instal·lació",
        rewardEuros: 95,
      },

      // NIVELL 5 (PROENCAT 2030)
      {
        id: 'm5-offshore-wind',
        level: 5,
        title: "Eòlica Marina Flotant (Golf de Roses)",
        description: "Connecta el macroparc eòlic marí flotant del Golf de Roses (850 MW) a la xarxa d'alta tensió per liderar la transició.",
        completed: false,
        progressText: "Pendent d'enllaç marí",
        rewardEuros: 140,
      },
      {
        id: 'm5-biomass-circular',
        level: 5,
        title: "Economia Circular & Biomassa Garrotxa",
        description: "Connecta la central de biogàs i biomassa de la Garrotxa (240 MW) i alimenta Olot amb energia de base renovable.",
        completed: false,
        progressText: "Pendent de connexió",
        rewardEuros: 130,
      },
      {
        id: 'm5-aran-autonomous',
        level: 5,
        title: "Sobirania Energètica de l'Alta Muntanya",
        description: "Estén la xarxa per abastir Vielha e Mijaran (Val d'Aran) integrant les valls pirinenques a la seguretat energètica.",
        completed: false,
        progressText: "Pendent d'arribar a l'Aran",
        rewardEuros: 130,
      },
      {
        id: 'm5-green-h2-v2g',
        level: 5,
        title: "Reconversió 100% Hidrogen Verd & V2G",
        description: "Reconverteix un Cicle Combinat a 100% Hidrogen Verd o instal·la tecnologia Vehicle-to-Grid (V2G) a les ciutats per a emmagatzematge mòbil.",
        completed: false,
        progressText: "Pendent d'acció 2030",
        rewardEuros: 135,
      },
      {
        id: 'm5-zero-net-emissions',
        level: 5,
        title: "Neutralitat Climàtica PROENCAT 2030",
        description: "Arriba a 5.000 MWh totals entregats mantenint el total de CO₂ per sota de 25 tones en la simulació global.",
        completed: false,
        progressText: "0 / 5000 MWh",
        rewardEuros: 160,
      },
    ];
  }

  private updateMissions(dt: number) {
    // Track frequency stability timer for m1 (Banda de control primari: ±0.15 Hz -> 49.85 - 50.15 Hz)
    if (Math.abs(this.telemetry.gridFrequency - CONFIG.TARGET_FREQUENCY_HZ) <= 0.15 && this.telemetry.totalGenerationMW > 150) {
      this.stableFreqTimer += dt;
    } else {
      this.stableFreqTimer = Math.max(0, this.stableFreqTimer - dt * 0.4);
    }

    for (const m of this.allMissions) {
      if (m.level > this.currentLevel) continue;
      if (m.completed) continue;

      if (m.id === 'm1-connect-amb') {
        const mwh = this.telemetry.scoreMWhDelivered;
        m.progressText = `${mwh} / 300 MWh`;
        if (mwh >= 300) {
          this.completeMission(m);
        }
      } else if (m.id === 'm1-bess-storage') {
        const sub = this.nodes.find(n => n.id === 'sub-rubi-canjardi');
        const count = sub?.batteryCount || (sub?.hasBattery ? 1 : 0);
        m.progressText = `${count} / 2 BESS`;
        if (count >= 2) {
          this.completeMission(m);
        }
      } else if (m.id === 'm1-freq-stable') {
        const sec = Math.min(20, Math.round(this.stableFreqTimer));
        m.progressText = `${sec} / 20 s`;
        if (this.stableFreqTimer >= 20) {
          this.completeMission(m);
        }
      } else if (m.id === 'm1-hospital-microgrid') {
        const hosp = this.nodes.find(n => n.id === 'cons-hospital-vallhebron');
        const ready = Boolean(hosp?.hasHospitalMicrogrid);
        m.progressText = ready ? "SAI d'emergència actiu! ✅" : "Instal·la SAI a l'Hospital";
        if (ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm1-rooftop-solar') {
        const bcn = this.nodes.find(n => n.id === 'cons-barcelona' || n.id === 'cons-bcn-eixample' || n.id === 'cons-valles-ciutats');
        const anyUrbanUpgraded = this.nodes.some(
          n => n.type === 'CONSUMER' && (n.hasRooftopSolar || n.hasThermalInsulation || n.hasSmartMetering || n.hasSmartLED || n.hasV2G)
        );
        const ready = Boolean(bcn?.hasRooftopSolar || bcn?.hasThermalInsulation || bcn?.hasSmartMetering || bcn?.hasSmartLED || bcn?.hasV2G || anyUrbanUpgraded);
        m.progressText = ready ? "Eficiència urbana activa! ✅" : "Instal·la una millora a Barcelona o ciutats";
        if (ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm2-ebre-hub') {
        const hasSouthLink = this.lines.some(
          l => (l.nodeIds.includes('sub-vandellos-hub') || l.nodeIds.includes('sub-ebre-tortosa')) &&
               (l.nodeIds.includes('cons-petroquimic') || l.nodeIds.includes('cons-tortosa') || l.nodeIds.includes('cons-tarragona-ciutat'))
        );
        const hasGen = this.lines.some(l => l.nodeIds.includes('gen-nuclear-asco') || l.nodeIds.includes('gen-nuclear-vandellos') || l.nodeIds.includes('gen-wind-terra-alta'));
        m.progressText = hasSouthLink && hasGen ? "Completat! ✅" : "Falta connectar centrals i ciutats";
        if (hasSouthLink && hasGen) {
          this.completeMission(m);
        }
      } else if (m.id === 'm2-critical-ports') {
        const portConnected = this.lines.some(l => l.nodeIds.includes('cons-zona-franca'));
        const airportConnected = this.lines.some(l => l.nodeIds.includes('cons-aeroport-elprat'));
        const beguesConnected = this.lines.some(l => l.nodeIds.includes('sub-begues'));
        const ready = portConnected && airportConnected && beguesConnected;
        m.progressText = ready ? "Infraestructures abastides! ✅" : "Connecta Begues, Port i Aeroport";
        if (ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm2-low-carbon') {
        const bd = this.telemetry.generationBreakdown;
        const total = this.telemetry.totalGenerationMW;
        const cleanRatio = total > 0 && bd ? Math.round(((total - bd.gasMW) / total) * 100) : 0;
        m.progressText = `${cleanRatio}% neta (obj. 75%)`;
        if (this.currentLevel >= 2 && total >= 1500 && cleanRatio >= 75) {
          this.completeMission(m);
        }
      } else if (m.id === 'm2-port-cold-ironing') {
        const zf = this.nodes.find(n => n.id === 'cons-zona-franca');
        const ready = Boolean(zf?.hasPortElectrification || zf?.hasEcoFilters || this.nodes.some(n => n.hasPortElectrification));
        m.progressText = ready ? "Molls electrificats! ✅" : "Instal·la Cold Ironing a Zona Franca/Port";
        if (this.currentLevel >= 2 && ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm2-petro-efficiency') {
        const indUpgraded = this.nodes.some(
          n => (n.id === 'cons-petroquimic' || n.consumerType === 'INDUSTRIAL') &&
               (n.hasEcoFilters || n.hasHeatRecovery || n.hasPortElectrification || n.isInterrupted)
        );
        m.progressText = indUpgraded ? "Gestió industrial activa! ✅" : "Instal·la filtres, cogeneració o interrompibilitat";
        if (this.currentLevel >= 2 && indUpgraded) {
          this.completeMission(m);
        }
      } else if (m.id === 'm3-pyrenees-hydro') {
        const hydros = this.nodes.filter(n => n.generatorType === 'HYDRO_PUMP');
        const maxHydro = hydros.reduce((acc, h) => Math.max(acc, Math.round(h.hydroStorage || 0)), 0);
        m.progressText = `${maxHydro}% / 85%`;
        if (this.currentLevel >= 3 && maxHydro >= 85) {
          this.completeMission(m);
        }
      } else if (m.id === 'm3-zero-curtailment') {
        const mwh = this.telemetry.scoreMWhDelivered;
        m.progressText = `${mwh} / 2500 MWh`;
        if (this.currentLevel >= 3 && mwh >= 2500 && this.telemetry.curtailedEnergyMWh <= 450) {
          this.completeMission(m);
        }
      } else if (m.id === 'm3-substation-ring') {
        const subLinks = this.lines.filter(l => {
          const n1 = this.nodes.find(n => n.id === l.nodeIds[0]);
          const n2 = this.nodes.find(n => n.id === l.nodeIds[1]);
          return n1?.type === 'SUBSTATION' && n2?.type === 'SUBSTATION';
        }).length;
        m.progressText = `${subLinks} / 3 enllaços inter-subestació`;
        if (this.currentLevel >= 3 && subLinks >= 3) {
          this.completeMission(m);
        }
      } else if (m.id === 'm3-solar-trackers') {
        const sol = this.nodes.find(n => n.id === 'gen-solar-ponent');
        const ready = Boolean(sol?.hasSolarTrackers || this.nodes.some(n => n.hasSolarTrackers || n.hasHydroPeltonUpgrade));
        m.progressText = ready ? "Tecnologia de generació activa! ✅" : "Instal·la seguidors a Solar Ponent o Pelton";
        if (this.currentLevel >= 3 && ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm3-smart-meters') {
        const smartNodes = this.nodes.filter(n => n.hasSmartMetering || n.hasV2G);
        m.progressText = `${smartNodes.length} / 1 node intel·ligent`;
        if (this.currentLevel >= 3 && smartNodes.length >= 1) {
          this.completeMission(m);
        }
      } else if (m.id === 'm4-france-interconn') {
        const connected = this.isFranceInterconnConnected();
        m.progressText = connected ? "Línia MAT França activa! ✅" : "Pendent d'estendre MAT a Santa Llogaia";
        if (this.currentLevel >= 4 && connected) {
          this.completeMission(m);
        }
      } else if (m.id === 'm4-international-trade') {
        m.progressText = `${this.internationalTradesCount} / 1 operació`;
        if (this.currentLevel >= 4 && this.internationalTradesCount >= 1) {
          this.completeMission(m);
        }
      } else if (m.id === 'm4-100-renewables') {
        const bd = this.telemetry.generationBreakdown;
        const gasZero = bd && bd.gasMW === 0;
        const demHigh = this.telemetry.totalDemandMW >= 2000;
        m.progressText = gasZero && demHigh ? "100% lliure de gas assolit! ✅" : `Gas: ${bd?.gasMW || 0} MW (ha de ser 0)`;
        if (this.currentLevel >= 4 && gasZero && demHigh) {
          this.completeMission(m);
        }
      } else if (m.id === 'm4-emporda-wind') {
        const empordaConn = this.lines.some(l => l.nodeIds.includes('gen-wind-emporda'));
        const gironaSupplied = this.lines.some(l => l.nodeIds.includes('cons-girona') || l.nodeIds.includes('cons-figueres'));
        const ready = empordaConn && gironaSupplied;
        m.progressText = ready ? "Parc de l'Empordà integrat! ✅" : "Connecta l'Empordà i proveeix Girona/Figueres";
        if (this.currentLevel >= 4 && ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm4-biomass-wind-tech') {
        const alb = this.nodes.find(n => n.id === 'gen-wind-emporda');
        const bio = this.nodes.find(n => n.id === 'gen-biomass-osona');
        const ready = Boolean(alb?.hasLowWindBlades || bio?.hasBiomassGasifier);
        m.progressText = ready ? "Tecnologia neta activa! ✅" : "Instal·la pales a l'Albera o gasificador a Osona";
        if (this.currentLevel >= 4 && ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm5-offshore-wind') {
        const offshoreConn = this.lines.some(l => l.nodeIds.includes('gen-wind-offshore-roses'));
        m.progressText = offshoreConn ? "Eòlica Marina Flotant connectada! ✅" : "Connecta el Golf de Roses (850 MW) a la xarxa";
        if (this.currentLevel >= 5 && offshoreConn) {
          this.completeMission(m);
        }
      } else if (m.id === 'm5-biomass-circular') {
        const biomassConn = this.lines.some(l => l.nodeIds.includes('gen-biomass-garrotxa'));
        const olotConn = this.lines.some(l => l.nodeIds.includes('cons-olot'));
        const ready = biomassConn && olotConn;
        m.progressText = ready ? "Biomassa de proximitat activa! ✅" : "Connecta la Garrotxa i alimenta Olot";
        if (this.currentLevel >= 5 && ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm5-aran-autonomous') {
        const aranConn = this.lines.some(l => l.nodeIds.includes('cons-vielha-aran'));
        m.progressText = aranConn ? "Val d'Aran integrada! ✅" : "Estén la línia fins a Vielha e Mijaran";
        if (this.currentLevel >= 5 && aranConn) {
          this.completeMission(m);
        }
      } else if (m.id === 'm5-green-h2-v2g') {
        const ready = this.nodes.some(n => n.hasGreenHydrogen100 || n.hasGasHydrogenMix || n.hasV2G);
        m.progressText = ready ? "H2 Verd / V2G desplegat! ✅" : "Instal·la 100% Hidrogen Verd o V2G";
        if (this.currentLevel >= 5 && ready) {
          this.completeMission(m);
        }
      } else if (m.id === 'm5-zero-net-emissions') {
        const mwh = this.telemetry.scoreMWhDelivered;
        const co2Kg = Math.round(this.telemetry.co2EmissionsAccumulated);
        m.progressText = `${mwh} / 5000 MWh (CO₂: ${Math.round(co2Kg / 1000)} t)`;
        if (this.currentLevel >= 5 && mwh >= 5000 && co2Kg <= 25000) {
          this.completeMission(m);
        }
      }
    }

    this.telemetry.missions = this.allMissions.filter(m => m.level === this.currentLevel);
    this.checkLevelProgression();
  }

  private completeMission(m: LevelMission) {
    m.completed = true;
    m.progressText = "Assolit! ✅";
    this.telemetry.budgetEuros = Math.round(this.telemetry.budgetEuros + m.rewardEuros);
    this.notify(`🏆 Missió completada: "${m.title}"! Recompensa: +${m.rewardEuros} k€`, false);
  }

  private updateDynamicEvents(dt: number) {
    if (this.telemetry.activeEvent) {
      this.telemetry.activeEvent.remainingSec -= dt;
      if (this.telemetry.activeEvent.remainingSec <= 0) {
        this.notify(`🌤️ Normalitat restablerta: ha finalitzat "${this.telemetry.activeEvent.title}".`, false);
        this.telemetry.activeEvent = null;
        this.eventCooldownTimer = 28 + Math.random() * 15;
      }
      return;
    }

    // Start dynamic events from Day 2 onwards
    if (this.telemetry.dayCount < 2) return;

    this.eventCooldownTimer -= dt;
    if (this.eventCooldownTimer <= 0) {
      const hour = this.telemetry.dayTimeHours;
      const candidates: ActiveGridEvent[] = [];

      if (hour >= 11 && hour <= 18) {
        candidates.push({
          type: 'HEAT_WAVE',
          title: 'Onada de Calor Extrema (+55% A/C)',
          description: "Es dispara l'aire condicionat a les ciutats! La demanda residencial puja un +55%, però la radiació solar augmenta un +15%.",
          icon: '🌡️',
          remainingSec: 18,
          totalSec: 18,
        });
      }

      if (this.currentLevel >= 2) {
        candidates.push({
          type: 'PEAK_INDUSTRY',
          title: 'Punta de Producció Industrial (+45%)',
          description: "Els polígons industrials (Petroquímic, Zona Franca, SEAT) operen al màxim rendiment (+45% MW).",
          icon: '🏭',
          remainingSec: 16,
          totalSec: 16,
        });
      }

      if (this.currentLevel >= 3) {
        candidates.push({
          type: 'WIND_CALM',
          title: 'Calma Eòlica Anticiclònica',
          description: "El vent cau per sota dels 8 km/h a la Terra Alta i l'Empordà. Utilitza bateries, nuclear o hidroelèctrica!",
          icon: '🍃',
          remainingSec: 17,
          totalSec: 17,
        });
        candidates.push({
          type: 'TRAMUNTANA_STORM',
          title: 'Temporal de Tramuntana i Aparat Elèctric',
          description: "Ratxes de >90 km/h! Es redueix la llum solar per núvols densos i una línia no reforçada pot patir un tall temporal.",
          icon: '⛈️',
          remainingSec: 15,
          totalSec: 15,
        });
      }

      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        this.telemetry.activeEvent = chosen;
        // L'esdeveniment ja es mostra directament a la targeta superior dedicatada amb barra de temps

        // If Tramuntana storm, potentially trip one non-reinforced line if multiple lines exist
        if (chosen.type === 'TRAMUNTANA_STORM' && this.lines.length >= 5) {
          const vulnerableLines = this.lines.filter(l => !l.isReinforced && !l.isTripped);
          if (vulnerableLines.length > 0) {
            const victim = vulnerableLines[Math.floor(Math.random() * vulnerableLines.length)];
            victim.isTripped = true;
            victim.tripTimer = CONFIG.CIRCUIT_BREAKER_TRIP_TIME_SEC;
            this.spawnOverloadSparks(victim);
          }
        }
      } else {
        this.eventCooldownTimer = 15;
      }
    }

    // Occasional Scheduled Maintenance / Refueling Outages on Nuclear Units (every ~60s in Level >= 2)
    if (this.currentLevel >= 2) {
      this.maintenanceCooldownTimer -= dt;
      if (this.maintenanceCooldownTimer <= 0) {
        this.maintenanceCooldownTimer = 55 + Math.random() * 25;
        const nuclearNodes = this.nodes.filter(n => n.generatorType === 'NUCLEAR' && !n.isMaintenanceOutage);
        if (nuclearNodes.length > 0) {
          const victim = nuclearNodes[Math.floor(Math.random() * nuclearNodes.length)];
          victim.isMaintenanceOutage = true;
          victim.maintenanceTimer = 22; // 22s scheduled maintenance outage
          this.notify(`🔧 ATURADA PROGRAMADA: ${victim.name} inicia recàrrega de combustible (22s a 0 MW). Despatxa cicle combinat o hidroelèctrica!`, true);
        }
      }
    }
  }

  isNodeConnected(nodeId: string): boolean {
    return this.lines.some(l => !l.isTripped && l.nodeIds.includes(nodeId));
  }

  private computeGeneratorPowerForThrottle(node: GridNode, throttle: number): number {
    if (node.isMaintenanceOutage) return 0;
    switch (node.generatorType) {
      case 'NUCLEAR': {
        const uprateMult = node.hasNuclearUprate ? 1.10 : 1.0;
        return Math.round(node.nominalPower * uprateMult * throttle);
      }
      case 'SOLAR': {
        let solarEff = this.weather.solarIntensity;
        if (node.hasSolarTrackers && solarEff > 0.05) {
          solarEff = Math.min(1.0, solarEff * 1.25);
        }
        return Math.round(node.nominalPower * solarEff * throttle);
      }
      case 'WIND': {
        const cutIn = node.hasLowWindBlades ? 7 : 12;
        const windFactor = Math.min(1.0, Math.max(0, (this.weather.windSpeed - cutIn) / 50));
        const boost = node.hasLowWindBlades ? 1.20 : 1.0;
        return Math.round(node.nominalPower * Math.min(1.0, windFactor * boost) * throttle);
      }
      case 'HYDRO_PUMP': {
        const hMode = node.hydroMode || 'AUTO';
        const hStorage = node.hydroStorage ?? 75;
        let p = 0;
        if (hMode === 'PUMPING') {
          p = 0;
        } else if (hMode === 'TURBO') {
          p = hStorage > 0 ? Math.round(node.nominalPower * 1.4 * throttle) : 0;
        } else if (hMode === 'TURBINING') {
          p = hStorage > 0 ? Math.round(node.nominalPower * throttle) : 0;
        } else {
          const isMiddaySolar = this.weather.solarIntensity > 0.55;
          p = (!isMiddaySolar && hStorage > 0) ? Math.round(node.nominalPower * throttle) : 0;
        }
        if (p > 0 && node.hasHydroPeltonUpgrade) {
          p = Math.round(p * 1.20);
        }
        return p;
      }
      case 'GAS_COMBINED':
        return throttle > 0.01 ? Math.round(node.nominalPower * throttle) : 0;
      case 'BIOMASS': {
        const gasifierMult = node.hasBiomassGasifier ? 1.20 : 1.0;
        return Math.round(node.nominalPower * gasifierMult * throttle);
      }
      default:
        return 0;
    }
  }

  private updateGradualGeneration(dt: number) {
    let activeGenMW = 0;
    let renewableMW = 0;
    let nuclearMW = 0;
    let solarMW = 0;
    let windMW = 0;
    let hydroMW = 0;
    let gasMW = 0;
    let biomassMW = 0;

    for (const node of this.nodes) {
      if (node.type !== 'GENERATOR' || !node.generatorType) continue;
      node.hydroPumpingLoadMW = 0;

      // Handle scheduled nuclear refueling / maintenance outage
      if (node.isMaintenanceOutage) {
        node.maintenanceTimer = (node.maintenanceTimer || 0) - dt;
        if (node.maintenanceTimer <= 0) {
          node.isMaintenanceOutage = false;
          node.maintenanceTimer = 0;
          this.notify(`🔧 ${node.name}: Manteniment i recàrrega de combustible finalitzada. Retorn a operació!`, false);
        } else {
          node.currentPower = 0;
          continue;
        }
      }

      // Throttle slider support for ALL generators (0.0 to 1.0)
      let targetThrottle = node.throttle !== undefined 
        ? node.throttle 
        : (node.gasThrottle !== undefined 
          ? node.gasThrottle 
          : (node.generatorType === 'GAS_COMBINED' ? (node.isGasActive ? 0.65 : 0.0) : 1.0));

      // Realistic Nuclear Thermal Inertia: slow ramp rate (max ~10% per real second)
      if (node.generatorType === 'NUCLEAR') {
        const cur = node.throttle ?? 1.0;
        if (Math.abs(cur - targetThrottle) > 0.01) {
          const maxStep = dt * 0.12; // slow thermal ramp
          if (cur < targetThrottle) {
            node.throttle = Math.min(targetThrottle, cur + maxStep);
          } else {
            node.throttle = Math.max(targetThrottle, cur - maxStep);
          }
        }
      } else {
        node.throttle = targetThrottle;
      }

      const throttle = node.throttle ?? 1.0;
      const connected = this.isNodeConnected(node.id);
      const power = connected ? this.computeGeneratorPowerForThrottle(node, throttle) : 0;

      switch (node.generatorType) {
        case 'NUCLEAR': {
          nuclearMW += power;
          break;
        }
        case 'SOLAR': {
          renewableMW += power;
          solarMW += power;
          break;
        }
        case 'WIND': {
          renewableMW += power;
          windMW += power;
          break;
        }
        case 'HYDRO_PUMP': {
          const hMode = node.hydroMode || 'AUTO';
          node.hydroMode = hMode;
          const hStorage = node.hydroStorage ?? 75;
          const isReversibleCapable = node.id === 'gen-hydro-pallars' || Boolean(node.hasHydroPeltonUpgrade);
          if (connected && isReversibleCapable && hStorage < 99.5) {
            if (hMode === 'PUMPING' || (hMode === 'AUTO' && this.weather.solarIntensity > 0.55 && this.telemetry.gridFrequency >= 50.0)) {
              // Bombament actiu cap a l'estany superior: actua com a gran consumidor elèctric síncron (~50% de la potència nominal)
              node.hydroPumpingLoadMW = Math.round(node.nominalPower * 0.50);
            }
          }
          renewableMW += power;
          hydroMW += power;
          break;
        }
        case 'GAS_COMBINED':
          if (power > 0) {
            gasMW += power;
            if (node.hasGreenHydrogen100) {
              // 100% Hidrogen Verd / Biometà renovable: 0 emissions fòssils i compta com a renovable
              renewableMW += power;
            } else {
              // 450 g CO2 / kWh (o 270 g amb hibridació 20% hidrogen verd: -40%)
              const co2Factor = node.hasGasHydrogenMix ? 0.27 : 0.45;
              const emittedKg = (power * 1000 * co2Factor * (dt / 3600));
              this.telemetry.co2EmissionsAccumulated += emittedKg;
              // EU ETS Carbon Market Penalty
              const etsCost = (emittedKg / 1000) * 1.8;
              this.telemetry.etsPenaltyEuros = Math.round((this.telemetry.etsPenaltyEuros + etsCost) * 10) / 10;
              this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - etsCost) * 10) / 10);
              this.frameCashflowEuros -= etsCost;
            }
            node.isGasActive = true;
          } else {
            node.isGasActive = false;
          }
          break;
        case 'BIOMASS': {
          renewableMW += power;
          biomassMW += power;
          break;
        }
      }

      node.currentPower = power;
      activeGenMW += power;

      if (power > 0) {
        let timer = (this.nodeSpawnTimers.get(node.id) || 0) + dt;
        const interval = Math.max(0.45, 1600 / power);

        if (timer >= interval) {
          timer = 0;
          const maxQ = node.maxGenerationQueue || 6;
          if ((node.generationQueue || 0) < maxQ) {
            node.generationQueue = (node.generationQueue || 0) + 1;
          }
        }
        this.nodeSpawnTimers.set(node.id, timer);
      }
    }

    // Absorció natural de CO2 per la massa forestal i sumidors naturals de Catalunya (64% del territori català és bosc)
    // Quan no s'està cremant gas (0 MW), els boscos i conreus absorbeixen activament el CO2 acumulat (-65 kg/s), superant les emissions industrials residuals
    if (gasMW === 0 && this.telemetry.co2EmissionsAccumulated > 0) {
      const naturalAbsorptionKg = 65 * dt;
      this.telemetry.co2EmissionsAccumulated = Math.max(0, this.telemetry.co2EmissionsAccumulated - naturalAbsorptionKg);
    }

    this.recomputeGenerationBreakdown();
    this.renewableSamples.push(this.telemetry.renewablePercentage);

    // Dynamic CO2 Alert Levels (Protocol d'Episodis Ambientals de Catalunya)
    const co2Ratio = this.telemetry.co2EmissionsAccumulated / this.telemetry.co2MaxLimit;
    if (co2Ratio >= 0.88) {
      this.telemetry.co2AlertLevel = 'EMERGENCY';
    } else if (co2Ratio >= 0.70) {
      this.telemetry.co2AlertLevel = 'EPISODE';
    } else if (co2Ratio >= 0.45) {
      this.telemetry.co2AlertLevel = 'PREVENTIVE';
    } else {
      this.telemetry.co2AlertLevel = 'OPTIMAL';
    }
  }

  private recomputeGenerationBreakdown() {
    let activeGenMW = 0;
    let renewableMW = 0;
    let nuclearMW = 0;
    let solarMW = 0;
    let windMW = 0;
    let hydroMW = 0;
    let gasMW = 0;
    let biomassMW = 0;

    for (const node of this.nodes) {
      if (node.type !== 'GENERATOR' || !node.generatorType || !this.isNodeConnected(node.id)) continue;
      const power = node.currentPower || 0;
      activeGenMW += power;

      switch (node.generatorType) {
        case 'NUCLEAR':
          nuclearMW += power;
          break;
        case 'SOLAR':
          solarMW += power;
          renewableMW += power;
          break;
        case 'WIND':
          windMW += power;
          renewableMW += power;
          break;
        case 'HYDRO_PUMP':
          hydroMW += power;
          renewableMW += power;
          break;
        case 'GAS_COMBINED':
          gasMW += power;
          if (node.hasGreenHydrogen100) {
            renewableMW += power;
          }
          break;
        case 'BIOMASS':
          biomassMW += power;
          renewableMW += power;
          break;
      }
    }

    this.telemetry.totalGenerationMW = activeGenMW;
    this.telemetry.renewablePercentage = activeGenMW > 0
      ? Math.round((renewableMW / activeGenMW) * 100)
      : 0;

    const sourcesList: EnergySourceStats[] = [
      { type: 'NUCLEAR', name: 'Nuclear', icon: '⚛️', mw: nuclearMW, pct: activeGenMW > 0 ? Math.round((nuclearMW / activeGenMW) * 100) : 0, color: '#9333EA' },
      { type: 'GAS_COMBINED', name: 'Cicle Combinat (Gas)', icon: '🔥', mw: gasMW, pct: activeGenMW > 0 ? Math.round((gasMW / activeGenMW) * 100) : 0, color: '#EA580C' },
      { type: 'WIND', name: 'Eòlica', icon: '💨', mw: windMW, pct: activeGenMW > 0 ? Math.round((windMW / activeGenMW) * 100) : 0, color: '#0284C7' },
      { type: 'HYDRO_PUMP', name: 'Hidroelèctrica', icon: '💧', mw: hydroMW, pct: activeGenMW > 0 ? Math.round((hydroMW / activeGenMW) * 100) : 0, color: '#0891B2' },
      { type: 'SOLAR', name: 'Solar FV', icon: '☀️', mw: solarMW, pct: activeGenMW > 0 ? Math.round((solarMW / activeGenMW) * 100) : 0, color: '#EAB308' },
      { type: 'BIOMASS', name: 'Biomassa & Biogàs', icon: '🪵', mw: biomassMW, pct: activeGenMW > 0 ? Math.round((biomassMW / activeGenMW) * 100) : 0, color: '#16A34A' },
    ];
    sourcesList.sort((a, b) => b.mw - a.mw);
    const leader = sourcesList[0].mw > 0 ? sourcesList[0] : null;

    this.telemetry.generationBreakdown = {
      nuclearMW,
      solarMW,
      windMW,
      hydroMW,
      gasMW,
      biomassMW,
      sources: sourcesList,
      leader,
    };
  }

  private updateGradualDemand(dt: number) {
    const hour = this.telemetry.dayTimeHours;
    let totalDemandMW = 0;
    let worstNode: GridNode | null = null;
    let worstTimer = 999;

    // 1. Suma la càrrega de bombament hidroelèctric actiu (Sallente / Susqueda en mode PUMPING absorbeixen MW excedents!)
    for (const gen of this.nodes) {
      if (gen.type === 'GENERATOR' && (gen.hydroPumpingLoadMW || 0) > 0 && this.isNodeConnected(gen.id)) {
        totalDemandMW += gen.hydroPumpingLoadMW!;
      }
    }

    for (const node of this.nodes) {
      if (node.type !== 'CONSUMER' || !node.consumerType) continue;

      let demandMultiplier = 0.55;

      // Corbes de demanda realistes segons la identitat geogràfica i funcional del node
      if (node.id === 'cons-hospital-vallhebron') {
        // Càrrega crítica hospitalària 24/7 (UCI, cirurgies, suport vital): no descansa de nit
        demandMultiplier = 0.90;
      } else if (node.id === 'cons-petroquimic') {
        // Craquejadors i reactors continus 24/7 de la petroquímica de Tarragona
        if (node.isInterrupted) {
          demandMultiplier = 0.20;
        } else {
          demandMultiplier = 0.95;
        }
        if (this.telemetry.activeEvent?.type === 'PEAK_INDUSTRY') {
          demandMultiplier *= 1.40;
        }
        if (node.hasHeatRecovery) {
          demandMultiplier *= 0.75; // Cogeneració: aprofita la calor residual i estalvia un 25% elèctric
        }
        if (node.hasPortElectrification) {
          demandMultiplier *= 0.70;
        }
      } else if (node.id === 'cons-seat-martorell') {
        // Cadena de muntatge d'automoció per torns de treball: fort consum de 6h a 22h, baix de nit
        if (node.isInterrupted) {
          demandMultiplier = 0.15;
        } else if (hour >= 6 && hour < 22) {
          demandMultiplier = 1.15;
        } else {
          demandMultiplier = 0.25;
        }
        if (this.telemetry.activeEvent?.type === 'PEAK_INDUSTRY') {
          demandMultiplier *= 1.35;
        }
        if (node.hasHeatRecovery) {
          demandMultiplier *= 0.80;
        }
        if (node.hasPortElectrification) {
          demandMultiplier *= 0.70;
        }
      } else if (node.id === 'cons-aeroport-elprat' || node.id === 'cons-zona-franca') {
        // Logística, terminals de passatgers i grues portuàries: actiu de 6h a 23h
        if (node.isInterrupted) {
          demandMultiplier = 0.25;
        } else if (hour >= 6 && hour < 23) {
          demandMultiplier = 0.90;
        } else {
          demandMultiplier = 0.40;
        }
        if (node.hasHeatRecovery) {
          demandMultiplier *= 0.80;
        }
        if (node.hasPortElectrification) {
          demandMultiplier *= 0.70; // Cold Ironing / Electrificació de molls i pistes
        }
      } else if (node.id === 'cons-lleida') {
        // Hub agroalimentari de Ponent: refrigeració de cambres frigorífiques i bombament de reg a la tarda
        if (hour >= 12 && hour < 18) {
          demandMultiplier = 1.15;
        } else if (hour >= 19 && hour < 22) {
          demandMultiplier = node.hasSmartMetering ? 0.70 : 1.05;
        } else if (hour >= 1 && hour < 6) {
          demandMultiplier = 0.35;
        } else {
          demandMultiplier = 0.70;
        }
        if (node.hasThermalInsulation) demandMultiplier *= 0.80;
        if (node.hasRooftopSolar && this.weather.solarIntensity > 0.15) {
          demandMultiplier *= Math.max(0.60, 1 - (this.weather.solarIntensity * 0.35));
        }
      } else if (node.id === 'cons-vielha-aran') {
        // Clima alpí d'alta muntanya: calefacció elèctrica intensa a la nit i matí
        if (hour >= 19 || hour < 8) {
          demandMultiplier = 0.90;
        } else {
          demandMultiplier = 0.65;
        }
        if (node.hasThermalInsulation) demandMultiplier *= 0.80;
        if (node.hasRooftopSolar && this.weather.solarIntensity > 0.15) {
          demandMultiplier *= Math.max(0.60, 1 - (this.weather.solarIntensity * 0.35));
        }
      } else if (node.consumerType === 'RESIDENTIAL') {
        if (hour >= 7 && hour < 9) {
          demandMultiplier = this.currentLevel === 1 ? 0.50 : 0.85;
        } else if (hour >= 18.5 && hour < 22.5) {
          demandMultiplier = this.currentLevel === 1
            ? (node.hasSmartMetering ? 0.45 : 0.55)
            : (node.hasSmartMetering ? 0.75 : 1.15);
          // Vehicle-to-Grid (V2G): descarrega cotxes elèctrics ciutadans durant el pic del vespre
          if (node.hasV2G) {
            demandMultiplier *= 0.75;
          }
        } else if (hour >= 1 && hour < 6) {
          demandMultiplier = this.currentLevel === 1 ? 0.30 : 0.35;
        } else {
          demandMultiplier = this.currentLevel === 1 ? 0.45 : 0.65;
        }

        if (this.telemetry.activeEvent?.type === 'HEAT_WAVE') {
          demandMultiplier *= 1.55;
        }
        // Millores d'eficiència a edificis i llars (4t d'ESO)
        if (node.hasThermalInsulation) {
          demandMultiplier *= 0.80; // Aïllament tèrmic Passivhaus: -20% consum continu
        }
        if (node.hasSmartLED && (hour >= 21 || hour < 6)) {
          demandMultiplier *= 0.80; // Enllumenat públic intel·ligent LED: -20% nocturn
        }
        if (node.hasRooftopSolar && this.weather.solarIntensity > 0.15) {
          demandMultiplier *= Math.max(0.60, 1 - (this.weather.solarIntensity * 0.35)); // Autoconsum solar a teulades
        }
      } else if (node.consumerType === 'INDUSTRIAL') {
        // Demand Response (Interrompibilitat remunerada)
        if (node.isInterrupted) {
          demandMultiplier = 0.15; // 85% load shed
        } else {
          demandMultiplier = 0.90;
        }
        if (this.telemetry.activeEvent?.type === 'PEAK_INDUSTRY') {
          demandMultiplier *= 1.45;
        }
        if (node.hasHeatRecovery) {
          demandMultiplier *= 0.75;
        }
        if (node.hasPortElectrification) {
          demandMultiplier *= 0.70;
        }
      } else if (node.consumerType === 'CRITICAL') {
        demandMultiplier = 0.85;
      }

      const calculatedDemand = Math.round(node.nominalPower * demandMultiplier);
      const isConnected = this.isNodeConnected(node.id);
      node.currentPower = calculatedDemand;
      // Només els consumidors connectats a la xarxa elèctrica sumen càrrega real als 50 Hz síncrons
      if (isConnected) {
        totalDemandMW += calculatedDemand;
      }

      // Direct industrial process emissions (chemical cracking, industrial heat in heavy factories)
      if ((node.consumerType === 'INDUSTRIAL' || node.id === 'cons-petroquimic') && isConnected && node.currentPower > 0 && !node.hasPortElectrification) {
        let emissionFactor = 0.15;
        if (node.hasEcoFilters) {
          emissionFactor *= 0.30; // -70% emissions amb filtres verds i calderes electrificades
        }
        if (node.hasHeatRecovery) {
          emissionFactor *= 0.70; // -30% emissions addicionals gràcies a la recuperació de calor
        }
        const indEmittedKg = (node.currentPower * 1000 * emissionFactor * (dt / 3600));
        this.telemetry.co2EmissionsAccumulated += indEmittedKg;
        const indEts = (indEmittedKg / 1000) * 0.8;
        this.telemetry.etsPenaltyEuros = Math.round((this.telemetry.etsPenaltyEuros + indEts) * 10) / 10;
        this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - indEts) * 10) / 10);
        this.frameCashflowEuros -= indEts;
      }

      let timer = (this.nodeSpawnTimers.get(node.id) || 0) + dt;
      const baseInterval = Math.max(3.5, 2000 / Math.max(50, calculatedDemand));
      // Els nodes que encara no estan connectats acumulen demanda més lentament per donar marge de planificació
      const interval = isConnected ? baseInterval : baseInterval * 1.8;

      if (timer >= interval) {
        timer = 0;
        if (node.demandSlots < node.maxDemandSlots) {
          node.demandSlots++;
        }
      }
      this.nodeSpawnTimers.set(node.id, timer);

      if (node.demandSlots >= node.maxDemandSlots) {
        node.isCriticalAlarm = true;
        let decayRate = this.telemetry.difficulty === 'AULA' ? 0.45 : 0.85;
        if (node.hasHospitalMicrogrid) {
          decayRate *= 0.40; // Microxarxa de seguretat: esmorteeix el desgast i dona marge extra
        }
        node.overloadTimer -= dt * decayRate;

        if (node.overloadTimer < worstTimer) {
          worstTimer = node.overloadTimer;
          worstNode = node;
        }
      } else {
        node.isCriticalAlarm = false;
        if (node.overloadTimer < node.maxOverloadTime) {
          node.overloadTimer = Math.min(node.maxOverloadTime, node.overloadTimer + dt * 1.5);
        }
      }
    }

    this.telemetry.totalDemandMW = totalDemandMW;
    this.telemetry.blackoutRiskNodeId = worstNode ? worstNode.id : null;
  }

  private popSubstationSourceType(substation: GridNode): GeneratorType {
    if (substation.substationPacketSources && substation.substationPacketSources.length > 0) {
      return substation.substationPacketSources.shift()!;
    }
    // Fallback: busca la primera central connectada a aquesta subestació per heretar-ne el tipus real
    const matLines = this.lines.filter(l => !l.isTripped && l.nodeIds.includes(substation.id));
    for (const l of matLines) {
      const otherId = l.nodeIds.find(id => id !== substation.id);
      const gen = this.nodes.find(n => n.id === otherId && n.type === 'GENERATOR' && (n.currentPower || 0) > 0);
      if (gen && gen.generatorType) return gen.generatorType;
    }
    return this.currentLevel === 1 ? 'SOLAR' : 'NUCLEAR';
  }

  private getDownstreamDemandDeficit(startSubId: string, viaNeighborId: string): number {
    const visited = new Set<string>([startSubId, viaNeighborId]);
    const queue: string[] = [viaNeighborId];
    let totalDeficit = 0;

    const neighborNode = this.nodes.find(n => n.id === viaNeighborId);
    if (!neighborNode) return 0;
    if (neighborNode.type === 'SUBSTATION') {
      totalDeficit -= (neighborNode.generationQueue || 0);
    } else if (neighborNode.type === 'CONSUMER') {
      totalDeficit += neighborNode.demandSlots;
    } else if (neighborNode.generatorType === 'HYDRO_PUMP' && (neighborNode.hydroPumpingLoadMW || 0) > 0) {
      totalDeficit += 3;
    }

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const connectedLines = this.lines.filter(l => !l.isTripped && l.nodeIds.includes(currId));

      for (const line of connectedLines) {
        const otherId = line.nodeIds.find(id => id !== currId);
        if (!otherId || visited.has(otherId)) continue;
        visited.add(otherId);

        const otherNode = this.nodes.find(n => n.id === otherId);
        if (!otherNode) continue;

        // In-flight packets headed towards otherId reduce the effective deficit
        const inFlight = this.packets.filter(p => p.lineId === line.id && p.toNodeId === otherId).length;
        totalDeficit -= inFlight;

        if (otherNode.type === 'CONSUMER') {
          totalDeficit += otherNode.demandSlots;
        } else if (otherNode.type === 'SUBSTATION') {
          totalDeficit -= (otherNode.generationQueue || 0);
          queue.push(otherId);
        } else if (otherNode.type === 'GENERATOR' && otherNode.generatorType === 'HYDRO_PUMP' && (otherNode.hydroPumpingLoadMW || 0) > 0) {
          totalDeficit += 3;
        }
      }
    }

    return totalDeficit;
  }

  private dispatchPacketsFromQueues(dt: number) {
    // 1. Dispatch from Generators to Substations
    for (const node of this.nodes) {
      if (node.type !== 'GENERATOR' || (node.generationQueue || 0) <= 0) continue;

      const connectedLines = this.lines.filter(
        l => !l.isTripped && l.nodeIds.includes(node.id) && l.currentPacketsCount < l.maxCapacity
      );

      if (connectedLines.length === 0) continue;

      for (const line of connectedLines) {
        if ((node.generationQueue || 0) <= 0) break;

        const otherNodeId = line.nodeIds.find(id => id !== node.id);
        if (!otherNodeId) continue;

        node.generationQueue!--;
        this.spawnPacket(line, node.id, otherNodeId, node.generatorType!);
      }
    }

    // 2. Dispatch from Substations to Consumers and to other Substations (preserving real packet sourceType!)
    for (const node of this.nodes) {
      if (node.type !== 'SUBSTATION' || (node.generationQueue || 0) <= 0) continue;

      // A) First Priority: Connected Consumers that actually have demandSlots > 0
      const outgoingDistLines = this.lines.filter(
        l => !l.isTripped && l.voltage === 'DISTRIBUTION' && l.nodeIds.includes(node.id) && l.currentPacketsCount < l.maxCapacity
      );

      // Sort by consumer demand slots descending
      outgoingDistLines.sort((a, b) => {
        const idA = a.nodeIds.find(id => id !== node.id)!;
        const idB = b.nodeIds.find(id => id !== node.id)!;
        const nodeA = this.nodes.find(n => n.id === idA);
        const nodeB = this.nodes.find(n => n.id === idB);
        return (nodeB?.demandSlots || 0) - (nodeA?.demandSlots || 0);
      });

      for (const distLine of outgoingDistLines) {
        if ((node.generationQueue || 0) <= 0) break;
        const targetId = distLine.nodeIds.find(id => id !== node.id)!;
        const targetNode = this.nodes.find(n => n.id === targetId);

        // Only send if consumer has positive unsatisfied demand slots
        if (targetNode && targetNode.demandSlots > 0) {
          node.generationQueue!--;
          const preservedSource = this.popSubstationSourceType(node);
          this.spawnPacket(distLine, node.id, targetId, preservedSource);
        }
      }

      // B) Second Priority: MAT Transmission - Smart Grid Demand-Aware Routing!
      // Forward surplus energy along MAT lines towards substations/consumers with positive net deficit
      if ((node.generationQueue || 0) > 0) {
        const matLines = this.lines.filter(
          l => !l.isTripped && l.voltage === 'MAT' && l.nodeIds.includes(node.id) && l.currentPacketsCount < l.maxCapacity
        );

        const candidates: { line: PowerLine; targetId: string; deficit: number }[] = [];

        for (const matLine of matLines) {
          const otherId = matLine.nodeIds.find(id => id !== node.id)!;
          const otherNode = this.nodes.find(n => n.id === otherId);
          if (!otherNode) continue;

          if (otherNode.type === 'SUBSTATION') {
            const otherQ = otherNode.generationQueue || 0;
            const maxQ = otherNode.maxGenerationQueue || 8;
            if (otherQ < maxQ - 1) {
              const deficit = this.getDownstreamDemandDeficit(node.id, otherId);
              // Only forward if there is genuine downstream demand / deficit!
              // This strictly prevents useless ping-pong oscillation between substations.
              if (deficit > 0) {
                candidates.push({ line: matLine, targetId: otherId, deficit });
              }
            }
          } else if (otherNode.generatorType === 'HYDRO_PUMP' && (otherNode.hydroPumpingLoadMW || 0) > 0) {
            candidates.push({ line: matLine, targetId: otherId, deficit: 5 });
          }
        }

        // Send to neighbor with highest downstream deficit first!
        candidates.sort((a, b) => b.deficit - a.deficit);

        for (const cand of candidates) {
          if ((node.generationQueue || 0) <= 0) break;
          node.generationQueue!--;
          const preservedSource = this.popSubstationSourceType(node);
          this.spawnPacket(cand.line, node.id, cand.targetId, preservedSource);
        }
      }

      // C) Third Priority: If queue is high (> 4) and no downstream deficit exists anywhere,
      // feed local consumers as base contract supply to prevent local curtailment and earn revenue
      if ((node.generationQueue || 0) > 4) {
        for (const distLine of outgoingDistLines) {
          if ((node.generationQueue || 0) <= 4) break;
          const targetId = distLine.nodeIds.find(id => id !== node.id)!;
          node.generationQueue!--;
          const preservedSource = this.popSubstationSourceType(node);
          this.spawnPacket(distLine, node.id, targetId, preservedSource);
        }
      }
    }
  }

  private updateLines(dt: number) {
    for (const line of this.lines) {
      line.pulsePhase = (line.pulsePhase + dt * 3) % (Math.PI * 2);

      if (line.isTripped) {
        line.tripTimer -= dt;
        if (line.tripTimer <= 0) {
          line.isTripped = false;
          line.tripTimer = 0;
        }
      }

      const packetsOnLine = this.packets.filter(p => p.lineId === line.id).length;
      line.currentPacketsCount = packetsOnLine;

      if (packetsOnLine > line.maxCapacity && !line.isTripped) {
        line.isTripped = true;
        line.tripTimer = CONFIG.CIRCUIT_BREAKER_TRIP_TIME_SEC;
        this.spawnOverloadSparks(line);
      }
    }
  }

  private updatePackets(dt: number) {
    const remainingPackets: EnergyPacket[] = [];

    for (const packet of this.packets) {
      const line = this.lines.find(l => l.id === packet.lineId);
      if (!line || line.isTripped) continue;

      const fromNode = this.nodes.find(n => n.id === packet.fromNodeId);
      const toNode = this.nodes.find(n => n.id === packet.toNodeId);
      if (!fromNode || !toNode) continue;

      const segmentLength = dist(fromNode.pos, toNode.pos);
      const stepDist = packet.speed * dt;
      const tDelta = stepDist / Math.max(1, segmentLength);

      packet.t += tDelta;

      // Pèrdues per Efecte Joule (P = I²·R): 3.8%/100px en Distribució (25 kV) vs 0.3%/100px en MAT (400 kV)
      const lossRate = packet.voltage === 'DISTRIBUTION'
        ? CONFIG.JOULE_LOSS_PROB_PER_100PX_DIST
        : CONFIG.JOULE_LOSS_PROB_PER_100PX_MAT;
      const jouleLossProb = (segmentLength / 100) * lossRate * dt;
      if (Math.random() < jouleLossProb) {
        this.spawnJouleSparks(fromNode.pos, toNode.pos, packet.t);
        continue;
      }

      if (packet.t >= 1.0) {
        this.deliverPacketToNode(packet, toNode);
      } else {
        remainingPackets.push(packet);
      }
    }

    this.packets = remainingPackets;
  }

  private deliverPacketToNode(packet: EnergyPacket, node: GridNode) {
    if (node.type === 'CONSUMER') {
      const priceFactor = this.telemetry.marketPriceEurMWh / 65;

      if (node.demandSlots > 0) {
        node.demandSlots--;
        this.telemetry.scoreMWhDelivered += CONFIG.PACKET_SIZE_MWH;
        // Tarifa punta per cobrir buits de demanda
        const peakRev = Math.round((this.currentLevel === 1 ? 0.80 : 0.55) * priceFactor * 10) / 10;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros + peakRev) * 10) / 10;
        this.frameCashflowEuros += peakRev;
        this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'ABSORB');
        return;
      }

      // If this consumer is satisfied, forward surplus packet to connected consumer with demand
      const forwardLines = this.lines.filter(
        l => !l.isTripped && l.voltage === 'DISTRIBUTION' && l.nodeIds.includes(node.id) && l.id !== packet.lineId && l.currentPacketsCount < l.maxCapacity
      );
      for (const fLine of forwardLines) {
        const nextId = fLine.nodeIds.find(id => id !== node.id);
        const nextNode = this.nodes.find(n => n.id === nextId);
        if (nextNode && nextNode.type === 'CONSUMER' && nextNode.demandSlots > 0) {
          this.spawnPacket(fLine, node.id, nextId!, packet.sourceType);
          return;
        }
      }

      // Retribució base de contracte per mantenir el subministrament constant a la ciutat
      this.telemetry.scoreMWhDelivered += CONFIG.PACKET_SIZE_MWH;
      const baseRev = Math.round((this.currentLevel === 1 ? 0.35 : 0.15) * priceFactor * 10) / 10;
      this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros + baseRev) * 10) / 10;
      this.frameCashflowEuros += baseRev;
      this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'ABSORB');
      return;
    }

    if (node.type === 'SUBSTATION') {
      const bCount = node.batteryCount || (node.hasBattery ? 1 : 0);
      const maxQ = node.maxGenerationQueue || 8;
      const curQ = node.generationQueue || 0;

      // 1. Prioritat al subministrament de les ciutats: mantingues almenys 2 paquets a la cua de transformació
      if (curQ < 2) {
        node.generationQueue = curQ + 1;
        if (!node.substationPacketSources) node.substationPacketSources = [];
        node.substationPacketSources.push(packet.sourceType);
        this.spawnParticle(node.pos.x, node.pos.y, '#38BDF8', 'CONVERTER');
        return;
      }

      // 2. Un cop cobert el coixí bàsic de trànsit, si té bateries BESS i no estan al 100%, emmagatzema l'excedent!
      if (bCount > 0 && (node.batteryStorage || 0) < 100) {
        node.batteryStorage = Math.min(100, (node.batteryStorage || 0) + (8 / bCount));
        node.batteryMode = 'CHARGING';
        this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'CONVERTER');
        return;
      }

      // 3. Si hi ha lloc a la cua de transformació per al trànsit immediat, desa també l'origen real del paquet:
      if (curQ < maxQ) {
        node.generationQueue = curQ + 1;
        if (!node.substationPacketSources) node.substationPacketSources = [];
        node.substationPacketSources.push(packet.sourceType);
        this.spawnParticle(node.pos.x, node.pos.y, '#38BDF8', 'CONVERTER');
        return;
      }

      // 4. CURTAILMENT / VESSAMENT: Cua plena i sense bateries -> L'energia es perd!
      this.telemetry.curtailedEnergyMWh += CONFIG.PACKET_SIZE_MWH;
      this.spawnParticle(node.pos.x, node.pos.y, '#F59E0B', 'JOULE');
      return;
    }

    if (node.type === 'GENERATOR' && node.generatorType === 'HYDRO_PUMP') {
      if ((node.hydroStorage || 0) < 100) {
        node.hydroStorage = Math.min(100, (node.hydroStorage || 0) + 4);
        this.spawnParticle(node.pos.x, node.pos.y, '#06B6D4', 'ABSORB');
      }
    }
  }

  private spawnPacket(line: PowerLine, fromId: string, toId: string, sourceType: GeneratorType) {
    const speed = line.voltage === 'MAT' ? CONFIG.PACKET_SPEED_MAT : CONFIG.PACKET_SPEED_DIST;
    this.packets.push({
      id: `pkt-${++this.packetIdCounter}`,
      lineId: line.id,
      sourceType,
      voltage: line.voltage,
      fromNodeId: fromId,
      toNodeId: toId,
      segmentIndex: 0,
      t: 0.0,
      speed,
    });
  }

  private updateStorage(dt: number) {
    const isSolarExcess = this.weather.solarIntensity > 0.25 || this.telemetry.gridFrequency > 50.05;
    const isNightOrPeak = this.telemetry.dayTimeHours >= 18.5 || this.telemetry.dayTimeHours < 7.0 || this.telemetry.gridFrequency < 49.95;

    for (const node of this.nodes) {
      const isConnected = this.isNodeConnected(node.id);
      if (!isConnected) {
        if (node.batteryMode) node.batteryMode = 'IDLE';
        continue;
      }

      if (node.generatorType === 'HYDRO_PUMP') {
        const hMode = node.hydroMode || 'AUTO';
        const isReversibleCapable = node.id === 'gen-hydro-pallars' || Boolean(node.hasHydroPeltonUpgrade);

        if (isReversibleCapable && (hMode === 'PUMPING' || (hMode === 'AUTO' && this.weather.solarIntensity > 0.55))) {
          node.hydroStorage = Math.min(100, (node.hydroStorage || 0) + dt * 2.5);
          if (Math.random() < 0.08) {
            this.spawnParticle(node.pos.x, node.pos.y, '#06B6D4', 'ABSORB');
          }
        } else if (hMode === 'TURBO' && (node.hydroStorage || 0) > 0) {
          node.hydroStorage = Math.max(0, (node.hydroStorage || 0) - dt * 2.4 * (node.throttle ?? 1));
        } else if ((hMode === 'TURBINING' || hMode === 'AUTO') && node.currentPower > 0) {
          node.hydroStorage = Math.max(0, (node.hydroStorage || 0) - dt * 1.1 * (node.throttle ?? 1));
        }
      }

      const bCount = node.batteryCount || (node.hasBattery ? 1 : 0);
      if (bCount > 0) {
        // Només carrega bateries si el node està connectat a la xarxa i hi ha sol o excedent
        if (isSolarExcess && (node.batteryStorage || 0) < 100) {
          node.batteryMode = 'CHARGING';
          node.batteryStorage = Math.min(100, (node.batteryStorage || 0) + dt * 4.0 * bCount);
          if (Math.random() < 0.06 * bCount) {
            this.spawnParticle(node.pos.x, node.pos.y, '#34D399', 'CONVERTER');
          }
        } 
        // Discharging during evening peak, night, or under-frequency when connected
        else if (isNightOrPeak && (node.batteryStorage || 0) > 0) {
          node.batteryMode = 'DISCHARGING';
          node.batteryStorage = Math.max(0, (node.batteryStorage || 0) - dt * 1.8);

          const bessKey = `${node.id}-bess`;
          let bessTimer = (this.nodeSpawnTimers.get(bessKey) || 0) + dt;
          const bessInterval = Math.max(0.65, 2.2 / bCount);

          if (bessTimer >= bessInterval) {
            bessTimer = 0;
            // Clear local demand slots if consumer
            if (node.type === 'CONSUMER' && node.demandSlots > 0) {
              node.demandSlots = Math.max(0, node.demandSlots - 1);
              this.telemetry.scoreMWhDelivered += CONFIG.PACKET_SIZE_MWH;
              this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'ABSORB');
            }
            // If substation, feed generationQueue so Smart Grid routes to local or MAT needy consumers!
            else if (node.type === 'SUBSTATION') {
              const curQ = node.generationQueue || 0;
              if (curQ < 5) {
                node.generationQueue = curQ + 1;
                if (!node.substationPacketSources) node.substationPacketSources = [];
                node.substationPacketSources.push('SOLAR');
                this.spawnParticle(node.pos.x, node.pos.y, '#38BDF8', 'CONVERTER');
              }
            }
          }
          this.nodeSpawnTimers.set(bessKey, bessTimer);
        } else {
          node.batteryMode = 'IDLE';
        }
      }
    }
  }

  private updateGridFrequency() {
    // Dynamic hourly electricity spot price (Duck Curve): 
    // Cheap at midday solar peak (25-35 €/MWh), expensive at evening peak 19-22h (110-150 €/MWh)
    const hour = this.telemetry.dayTimeHours;
    if (hour >= 11 && hour <= 15) {
      this.telemetry.marketPriceEurMWh = Math.round(25 + (1 - this.weather.solarIntensity) * 20);
    } else if (hour >= 19 && hour <= 22) {
      this.telemetry.marketPriceEurMWh = 135;
    } else if (hour >= 1 && hour <= 6) {
      this.telemetry.marketPriceEurMWh = 40;
    } else {
      this.telemetry.marketPriceEurMWh = 75;
    }

    // Suport ràpid de freqüència per part de les bateries BESS connectades (FCR - Frequency Containment Reserve)
    let batteryDischargeMW = 0;
    for (const node of this.nodes) {
      if (this.isNodeConnected(node.id) && node.batteryMode === 'DISCHARGING' && (node.batteryStorage || 0) > 0) {
        const bCount = node.batteryCount || (node.hasBattery ? 1 : 0);
        batteryDischargeMW += bCount * 120; // 120 MW de suport ràpid per mòdul
      }
    }

    // -------------------------------------------------------------------------
    // REGULACIÓ AUTOMÀTICA DE FREQÜÈNCIA / AGC (Automatic Generation Control)
    // Només regula centrals connectades a la xarxa i sempre respectant la meteorologia!
    // -------------------------------------------------------------------------
    const agcPlants = this.nodes.filter(
      n => n.type === 'GENERATOR' &&
           this.isNodeConnected(n.id) &&
           (n.hasAutoFrequencyRegulation || (n.generatorType === 'HYDRO_PUMP' && n.hydroMode === 'AUTO')) &&
           !n.isMaintenanceOutage
    );

    if (agcPlants.length > 0) {
      const currentNet = this.telemetry.totalGenerationMW + this.telemetry.interconnFlowMW + batteryDischargeMW;
      const currentDiff = currentNet - this.telemetry.totalDemandMW;

      if (Math.abs(currentDiff) > 5) {
        for (const plant of agcPlants) {
          // Calcula el sostre màxim real disponible segons sol/vent/aigua en aquest instant (throttle = 1.0)
          const maxAvailableMW = this.computeGeneratorPowerForThrottle(plant, 1.0);
          if (maxAvailableMW > 0) {
            const deltaThrottle = (-currentDiff / (agcPlants.length * maxAvailableMW)) * 0.25;
            const curThrottle = plant.throttle !== undefined ? plant.throttle : (plant.generatorType === 'GAS_COMBINED' ? (plant.isGasActive ? 0.65 : 0) : 1.0);
            const minThrottle = plant.generatorType === 'GAS_COMBINED' ? 0.0 : 0.05;
            const newThrottle = Math.max(minThrottle, Math.min(1.0, curThrottle + deltaThrottle));
            plant.throttle = Math.round(newThrottle * 100) / 100;
            plant.gasThrottle = plant.throttle;
            if (plant.generatorType === 'GAS_COMBINED') {
              plant.isGasActive = plant.throttle > 0.02;
            }
            plant.currentPower = this.computeGeneratorPowerForThrottle(plant, plant.throttle);
          } else {
            plant.currentPower = 0;
          }
        }

        // Recomputa la generació total i el desglossament del Mix reflectint l'ajust automàtic AGC
        this.recomputeGenerationBreakdown();
      }
    }

    if (this.lines.length === 0) {
      this.telemetry.gridFrequency = 50.00;
      return;
    }

    const netGenMW = this.telemetry.totalGenerationMW + this.telemetry.interconnFlowMW + batteryDischargeMW;
    const diffMW = netGenMW - this.telemetry.totalDemandMW;
    const sensFactor = this.telemetry.difficulty === 'OPERADOR' ? 0.00045 : 0.00025;
    const freqDev = Math.max(-CONFIG.MAX_FREQ_DEVIATION, Math.min(CONFIG.MAX_FREQ_DEVIATION, diffMW * sensFactor));
    this.telemetry.gridFrequency = Math.round((CONFIG.TARGET_FREQUENCY_HZ + freqDev) * 100) / 100;
  }

  private checkDefeatConditions(dt: number) {
    // 1. Consumer Deficit & Blackout Protection (Generous reaction window)
    for (const node of this.nodes) {
      if (node.type === 'CONSUMER' && node.overloadTimer <= 0) {
        // Heavy industry / petrochemical consequence on unmanaged emergency cutoff
        if (node.id === 'cons-petroquimic' || node.consumerType === 'INDUSTRIAL') {
          if (!node.isInterrupted) {
            const flareCO2Kg = node.id === 'cons-petroquimic' ? 3500 : 1500;
            const indFine = node.id === 'cons-petroquimic' ? 60 : 30;
            this.telemetry.co2EmissionsAccumulated += flareCO2Kg;
            this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - indFine) * 10) / 10);
            this.spawnParticle(node.pos.x, node.pos.y, '#EF4444', 'OVERLOAD');
            this.notify(`🔥 PARADA D'EMERGÈNCIA A ${node.name.toUpperCase()}! La caiguda elèctrica sobtada ha forçat l'encesa de torxes (+${flareCO2Kg} kg CO₂) i penalització industrial (-${indFine} k€)! Fes servir el botó 'Interrompibilitat' per a parades pactades.`, true);
          }
        }

        if (this.telemetry.difficulty === 'AULA') {
          // In Aula Mode, don't brutally trigger Game Over! Apply an emergency load shed fine and recover
          this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - 40) * 10) / 10);
          node.demandSlots = Math.floor(node.maxDemandSlots / 2);
          node.overloadTimer = node.maxOverloadTime * 0.75;
          node.isCriticalAlarm = false;
          this.notify(`⚠️ Tall temporal a ${node.name}! Multa econòmica de 40 k€. Connecta una línia o bateria per restablir el servei!`, true);
        } else {
          this.triggerGameOver('BLACKOUT', node.id, 'blackoutExplanation');
          return;
        }
      }
    }

    // 2. CO2 Emissions: Environmental Protocol (Never instant loss!)
    if (this.telemetry.co2EmissionsAccumulated >= this.telemetry.co2MaxLimit) {
      if (this.telemetry.difficulty === 'AULA') {
        // In Mode Aula: Apply ETS carbon tax penalty continuously, but NEVER game over!
        const penalty = Math.round(dt * 2.0 * 10) / 10;
        this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - penalty) * 10) / 10);
        this.telemetry.etsPenaltyEuros = Math.round((this.telemetry.etsPenaltyEuros + penalty) * 10) / 10;
        this.telemetry.co2AlertLevel = 'EMERGENCY';
      } else {
        // In Mode Operador: 45-second Decontamination Protocol countdown before defeat
        this.telemetry.co2GraceTimer = Math.max(0, (this.telemetry.co2GraceTimer ?? 45.0) - dt);
        this.telemetry.co2AlertLevel = 'EMERGENCY';
        if (this.telemetry.co2GraceTimer <= 0) {
          this.triggerGameOver('CLIMATE_EMERGENCY', undefined, 'climateExplanation');
          return;
        }
      }
    } else {
      this.telemetry.co2GraceTimer = 45.0;
    }

    // 3. Overfrequency Critical Trip: Generation >> Demand (25s realistic reaction timer)
    if (this.telemetry.gridFrequency >= 50.45) {
      this.telemetry.overFreqTimer = Math.max(0, this.telemetry.overFreqTimer - dt);
      if (this.telemetry.overFreqTimer <= 0) {
        if (this.telemetry.difficulty === 'AULA') {
          // In Aula Mode, safety relays automatically trip generation to save the grid
          for (const g of this.nodes.filter(n => n.type === 'GENERATOR')) {
            g.throttle = Math.max(0, (g.throttle || 1) - 0.4);
            g.currentPower = Math.round(g.nominalPower * (g.throttle || 0));
          }
          this.telemetry.overFreqTimer = 25.0;
          this.notify("⚠️ Relés de protecció activats: S'ha reduït automàticament la potència per evitar el col·lapse per sobrefreqüència (>50.45 Hz)!", true);
        } else {
          this.triggerGameOver('OVERFREQUENCY', undefined, 'overfrequencyExplanation');
          return;
        }
      }
    } else {
      this.telemetry.overFreqTimer = Math.min(25.0, this.telemetry.overFreqTimer + dt * 1.5);
    }
  }

  private triggerGameOver(reason: GameOverReason, culpritNodeId?: string, explanationKey: string = '') {
    this.gameOver = {
      isOver: true,
      reason,
      culpritNodeId,
      explanationKey,
      stats: {
        daysSurvived: this.telemetry.dayCount,
        mwhDelivered: this.telemetry.scoreMWhDelivered,
        renewableAvg: this.renewableSamples.length > 0 
          ? Math.round(this.renewableSamples.reduce((a, b) => a + b, 0) / this.renewableSamples.length)
          : 0,
        peakFrequencyDeviation: Math.round(Math.abs(this.telemetry.gridFrequency - 50.0) * 100) / 100,
        co2Emitted: Math.round(this.telemetry.co2EmissionsAccumulated / 1000),
      }
    };
    this.isPaused = true;
  }

  private updateSparks(dt: number) {
    const remainingSparks: SparkParticle[] = [];
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt * 2.5;
      if (s.life > 0) remainingSparks.push(s);
    }
    this.sparks = remainingSparks;
  }

  spawnParticle(x: number, y: number, color: string, type: 'JOULE' | 'OVERLOAD' | 'CONVERTER' | 'ABSORB') {
    const count = type === 'OVERLOAD' ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 50;
      this.sparks.push({
        id: `spk-${++this.sparkIdCounter}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: 3 + Math.random() * 3,
        type,
      });
    }
  }

  private spawnJouleSparks(p1: Point, p2: Point, t: number) {
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;
    this.spawnParticle(x, y, '#F97316', 'JOULE');
  }

  private spawnOverloadSparks(line: PowerLine) {
    for (const nodeId of line.nodeIds) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) this.spawnParticle(node.pos.x, node.pos.y, '#EF4444', 'OVERLOAD');
    }
  }

  // --- REGLAS TÈCNIQUES I PEDAGÒGIQUES ESTRICTES ---
  addLine(voltage: LineVoltage, nodeIds: [string, string]): LineCreationResult {
    if (nodeIds[0] === nodeIds[1]) {
      return { success: false, error: 'same_node', message: "No pots connectar un node amb si mateix." };
    }

    const n1 = this.nodes.find(n => n.id === nodeIds[0]);
    const n2 = this.nodes.find(n => n.id === nodeIds[1]);
    if (!n1 || !n2) {
      return { success: false, error: 'node_not_found', message: "Node no trobat." };
    }

    const alreadyExists = this.lines.some(
      l => l.nodeIds.includes(n1.id) && l.nodeIds.includes(n2.id)
    );
    if (alreadyExists) {
      return { success: false, error: 'line_already_exists', message: "Aquesta línia elèctrica ja està construïda." };
    }

    // 1. PROHIBICIÓ ESTRICTA: DUES CENTRALS NO ES PODEN CONNECTAR ENTRE ELLES
    if (n1.type === 'GENERATOR' && n2.type === 'GENERATOR') {
      const msg = "⚠️ Connexió invàlida! Dues centrals elèctriques NO es poden connectar directament entre elles: totes dues són generadors d'energia. Has de portar l'energia de cada central cap a una Subestació Transformadora!";
      this.notify(msg, true);
      return { success: false, error: 'generator_to_generator', message: msg };
    }

    // 2. PROHIBICIÓ ESTRICTA: CAP CENTRAL NO ES POT CONNECTAR DIRECTAMENT AMB UN CONSUMIDOR
    const isCentralToConsumer = (n1.type === 'GENERATOR' && n2.type === 'CONSUMER') ||
                                (n2.type === 'GENERATOR' && n1.type === 'CONSUMER');

    if (isCentralToConsumer) {
      const msg = "⚠️ Connexió prohibida! Cap central elèctrica no es pot connectar directament a una ciutat o hospital. Tota l'energia generada ha de passar obligatòriament per una Subestació Transformadora per adaptar la tensió!";
      this.notify(msg, true);
      return { success: false, error: 'generator_direct_to_consumer', message: msg };
    }

    // 3. VALIDACIÓ MANUAL ESTRICTA DE LA TENSIÓ SELECCIONADA PER L'ALUMNE
    const hasConsumer = n1.type === 'CONSUMER' || n2.type === 'CONSUMER';
    const hasGenerator = n1.type === 'GENERATOR' || n2.type === 'GENERATOR';

    // A) Si té seleccionat MAT 400 kV: només Central <-> Subestació o Subestació <-> Subestació
    if (voltage === 'MAT') {
      if (hasConsumer) {
        const msg = "⚠️ Error de tensió! Estàs intentant utilitzar una línia MAT (400.000 V) cap a una ciutat o hospital. Les ciutats només admeten Distribució (25 kV). Selecciona manualment el botó 'Distribució 25 kV' a la barra inferior!";
        this.notify(msg, true);
        return { success: false, error: 'mat_to_consumer', message: msg };
      }
    }

    // B) Si té seleccionat Distribució 25 kV: només Subestació <-> Consumidor o Consumidor <-> Consumidor
    if (voltage === 'DISTRIBUTION') {
      if (hasGenerator) {
        const msg = "⚠️ Error de tensió! Un cable fi de Distribució (25 kV) no suporta l'alta potència d'evacuació d'una central (es fondria per Efecte Joule). Selecciona manualment el botó 'MAT 400 kV' a la barra inferior!";
        this.notify(msg, true);
        return { success: false, error: 'dist_to_generator', message: msg };
      }
    }

    // 4. CÀLCUL DE DISTÀNCIA FÍSICA EN QUILÒMETRES (KM) I VALIDACIÓ DE PRESSUPOST DE CABLE
    const dx = n1.pos.x - n2.pos.x;
    const dy = n1.pos.y - n2.pos.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    const lengthKm = Math.max(3, Math.round(pixelDist * CONFIG.KM_PER_COORD_UNIT));

    // A) Validació de pressupost econòmic d'instal·lació
    const layingCost = Math.round(lengthKm * (voltage === 'MAT' ? 0.35 : 0.20) * 10) / 10;
    if (this.telemetry.budgetEuros < layingCost) {
      const msg = `⚠️ Pressupost insuficient! Estendre aquesta línia costa ${layingCost} k€ d'obra civil (en tens ${Math.round(this.telemetry.budgetEuros)} k€). Lliura energia per guanyar fons!`;
      this.notify(msg, true);
      return { success: false, error: 'insufficient_budget', message: msg };
    }

    // B) Validació de reserva física de cable disponible
    if (voltage === 'MAT') {
      const availableKm = this.inventory.matKmTotal - this.inventory.matKmUsed;
      if (lengthKm > availableKm) {
        const msg = `⚠️ Cable MAT insuficient! Aquest traçat requereix ${lengthKm} km de cable MAT 400 kV, però només en tens ${availableKm} km disponibles. Compra més cable a la reserva!`;
        this.notify(msg, true);
        return { success: false, error: 'no_mat_lines_available', message: msg };
      }
    } else {
      const availableKm = this.inventory.distKmTotal - this.inventory.distKmUsed;
      if (lengthKm > availableKm) {
        const msg = `⚠️ Cable de distribució insuficient! Aquest traçat requereix ${lengthKm} km de cable 25 kV, però només en tens ${availableKm} km disponibles. Compra més cable a la reserva!`;
        this.notify(msg, true);
        return { success: false, error: 'no_dist_lines_available', message: msg };
      }
    }

    const color = voltage === 'MAT' ? '#EA580C' : '#0284C7';
    const maxCapacity = voltage === 'MAT' ? CONFIG.MAX_PACKETS_MAT : CONFIG.MAX_PACKETS_DIST;

    const newLine: PowerLine = {
      id: `line-${voltage}-${++this.lineIdCounter}`,
      voltage,
      nodeIds: [n1.id, n2.id],
      color,
      isReinforced: false,
      maxCapacity,
      currentPacketsCount: 0,
      isTripped: false,
      tripTimer: 0,
      lengthKm,
      pulsePhase: 0,
    };

    this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - layingCost) * 10) / 10);
    this.lines.push(newLine);
    if (voltage === 'MAT') this.inventory.matKmUsed += lengthKm;
    else this.inventory.distKmUsed += lengthKm;

    if (voltage === 'DISTRIBUTION') {
      this.notify(`✅ Línia de Distribució (25 kV) estesa (${lengthKm} km • cost: ${layingCost} k€).`, false);
    } else {
      this.notify(`✅ Línia MAT (400 kV) estesa (${lengthKm} km • cost: ${layingCost} k€).`, false);
    }

    return { success: true };
  }

  notify(text: string, isError: boolean) {
    this.notificationMessage = { text, isError, timer: 5.0 };
    this.telemetry.lastNotification = { text, isError, timer: 5.0 };
  }

  removeLine(lineId: string) {
    const idx = this.lines.findIndex(l => l.id === lineId);
    if (idx === -1) return;

    const line = this.lines[idx];
    if (line.voltage === 'MAT') this.inventory.matKmUsed = Math.max(0, this.inventory.matKmUsed - line.lengthKm);
    else this.inventory.distKmUsed = Math.max(0, this.inventory.distKmUsed - line.lengthKm);

    const layingCost = Math.round(line.lengthKm * (line.voltage === 'MAT' ? 0.35 : 0.20) * 10) / 10;
    const refund = Math.round(layingCost * 0.70 * 10) / 10;
    this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros + refund) * 10) / 10;

    this.packets = this.packets.filter(p => p.lineId !== lineId);
    this.lines.splice(idx, 1);
    this.notify(`🗑️ Línia desmantellada: recuperats ${line.lengthKm} km de cable i reemborsats +${refund} k€ (70% de l'obra).`, false);
  }

  reinforceLine(lineId: string): boolean {
    const line = this.lines.find(l => l.id === lineId);
    if (!line) return false;
    if (line.isReinforced) {
      this.notify("⚠️ Aquesta línia ja està reforçada en Doble Circuit (x2)!", true);
      return false;
    }

    const cost = Math.max(20, Math.round(line.lengthKm * (line.voltage === 'MAT' ? 0.25 : 0.15)));
    if (this.telemetry.budgetEuros < cost) {
      this.notify(`⚠️ Pressupost insuficient! Reforçar aquesta línia en Doble Circuit costa ${cost} k€ (en tens ${Math.round(this.telemetry.budgetEuros)} k€).`, true);
      return false;
    }

    this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - cost) * 10) / 10);
    line.isReinforced = true;
    line.maxCapacity = line.maxCapacity * CONFIG.REINFORCED_MULTIPLIER;
    this.inventory.reinforcedLinesTotal += 1;

    const n1 = this.nodes.find(n => n.id === line.nodeIds[0]);
    const n2 = this.nodes.find(n => n.id === line.nodeIds[1]);
    if (n1 && n2) {
      this.spawnParticle((n1.pos.x + n2.pos.x) / 2, (n1.pos.y + n2.pos.y) / 2, '#38BDF8', 'CONVERTER');
    }

    this.notify(`💪 Línia reforçada en Doble Circuit (x2): Capacitat ampliada a ${line.maxCapacity} paquets i blindada contra temporals! (-${cost} k€)`, false);
    return true;
  }

  toggleBatteryOnNode(nodeId: string): boolean {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    if (node.type === 'GENERATOR' && node.generatorType !== 'HYDRO_PUMP') {
      this.notify("⚠️ Les bateries BESS s'instal·len a Subestacions (fins a 6 mòduls) o Nodes Consumidors (fins a 4 mòduls) per emmagatzemar energia.", true);
      return false;
    }

    const currentCount = node.batteryCount || (node.hasBattery ? 1 : 0);
    const maxBatteries = node.type === 'SUBSTATION' ? 6 : 4;

    if (currentCount >= maxBatteries) {
      this.notify(`⚠️ Aquest node ja té el límit màxim de bateries (${maxBatteries} mòduls BESS).`, true);
      return false;
    }

    const availableFromInventory = this.inventory.batteriesTotal - this.inventory.batteriesUsed;
    if (availableFromInventory > 0) {
      node.batteryCount = currentCount + 1;
      node.hasBattery = true;
      if (node.batteryStorage === undefined || node.batteryStorage === 0) {
        node.batteryStorage = 50;
      }
      this.inventory.batteriesUsed++;
      this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'CONVERTER');
      this.notify(`🔋 Mòdul BESS instal·lat a ${node.name} des de l'inventari (de franc)! En resten ${this.inventory.batteriesTotal - this.inventory.batteriesUsed} disp.`, false);
      return true;
    } else {
      if (this.telemetry.budgetEuros < 120) {
        this.notify(`⚠️ No et queden bateries BESS a l'inventari i comprar-ne una costa 120 k€ (en tens ${Math.round(this.telemetry.budgetEuros)} k€).`, true);
        return false;
      }
      this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - 120) * 10) / 10;
      this.inventory.batteriesTotal++;
      this.inventory.batteriesUsed++;
      node.batteryCount = currentCount + 1;
      node.hasBattery = true;
      if (node.batteryStorage === undefined || node.batteryStorage === 0) {
        node.batteryStorage = 50;
      }
      this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'CONVERTER');
      this.notify(`🔋 +1 Bateria BESS comprada i instal·lada a ${node.name} (120 k€).`, false);
      return true;
    }
  }

  removeBatteryFromNode(nodeId: string): boolean {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    const currentCount = node.batteryCount || (node.hasBattery ? 1 : 0);
    if (currentCount <= 0) return false;

    node.batteryCount = currentCount - 1;
    if (node.batteryCount === 0) {
      node.hasBattery = false;
      node.batteryStorage = 0;
      node.batteryMode = 'IDLE';
    }
    this.inventory.batteriesUsed = Math.max(0, this.inventory.batteriesUsed - 1);
    this.notify(`🔋 1 mòdul de bateria desinstal·lat de ${node.name}. Retornat a l'inventari.`, false);
    return true;
  }

  installUpgradeOnNode(nodeId: string, upgradeType: NodeUpgradeType): boolean {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    if (upgradeType === 'BATTERY') {
      return this.toggleBatteryOnNode(nodeId);
    }

    const costs: Record<NodeUpgradeType, number> = {
      ROOFTOP_SOLAR: 70,
      INSULATION: 75,
      ECO_FILTERS: 85,
      HOSPITAL_SAI: 65,
      SMART_METER: 80,
      BATTERY: 120,
      AUTO_FREQUENCY_AGC: 50,
      SOLAR_TRACKERS: 60,
      WIND_LOW_SPEED: 65,
      HYDRO_PELTON: 75,
      GAS_HYDROGEN: 80,
      NUCLEAR_UPRATE: 90,
      BIOMASS_GASIFIER: 60,
      V2G_CHARGING: 70,
      SMART_LED: 50,
      HEAT_RECOVERY: 75,
      GAS_GREEN_H2_100: 140,
      PORT_ELECTRIFICATION: 95,
    };

    const cost = costs[upgradeType];
    if (this.telemetry.budgetEuros < cost) {
      this.notify(`⚠️ Pressupost insuficient! Aquesta millora costa ${cost} k€ (en tens ${Math.round(this.telemetry.budgetEuros)} k€).`, true);
      return false;
    }

    switch (upgradeType) {
      case 'ROOFTOP_SOLAR':
        if (node.hasRooftopSolar) {
          this.notify(`⚠️ ${node.name} ja té instal·lat autoconsum solar!`, true);
          return false;
        }
        node.hasRooftopSolar = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#F59E0B', 'CONVERTER');
        this.notify(`☀️ Autoconsum Solar instal·lat a ${node.name}! Redueix un -35% la demanda d'energia de la xarxa en hores de sol.`, false);
        return true;

      case 'INSULATION':
        if (node.hasThermalInsulation) {
          this.notify(`⚠️ ${node.name} ja disposa d'aïllament tèrmic Passivhaus!`, true);
          return false;
        }
        node.hasThermalInsulation = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#14B8A6', 'CONVERTER');
        this.notify(`🏢 Aïllament Passivhaus instal·lat a ${node.name}! Redueix un -20% continu el consum de climatització.`, false);
        return true;

      case 'ECO_FILTERS':
        if (node.hasEcoFilters) {
          this.notify(`⚠️ ${node.name} ja compta amb filtres ecològics!`, true);
          return false;
        }
        node.hasEcoFilters = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'ABSORB');
        this.notify(`🌱 Filtres Verds & Captura CO₂ instal·lats a ${node.name}! Emissions industrials reduïdes un -70%.`, false);
        return true;

      case 'HOSPITAL_SAI':
        if (node.hasHospitalMicrogrid) {
          this.notify(`⚠️ ${node.name} ja compta amb microxarxa i SAIs d'emergència!`, true);
          return false;
        }
        node.hasHospitalMicrogrid = true;
        node.maxOverloadTime = 45;
        node.overloadTimer = 45;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#F43F5E', 'CONVERTER');
        this.notify(`🏥 Microxarxa SAI d'emergència instal·lada a ${node.name}! +45s de marge davant talls.`, false);
        return true;

      case 'SMART_METER':
        if (node.hasSmartMetering) {
          this.notify(`⚠️ ${node.name} ja compta amb comptadors intel·ligents!`, true);
          return false;
        }
        node.hasSmartMetering = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#3B82F6', 'CONVERTER');
        this.notify(`📱 Comptadors intel·ligents desplegats a ${node.name}! -30% consum en hores punta del vespre.`, false);
        return true;

      case 'AUTO_FREQUENCY_AGC':
        if (node.hasAutoFrequencyRegulation) {
          node.hasAutoFrequencyRegulation = false;
          this.notify(`⏸️ Sistema AGC desactivat a ${node.name}. Retorn a regulació manual.`, false);
          return true;
        }
        if (this.telemetry.budgetEuros < 50) {
          this.notify(`❌ Pressupost insuficient! El sistema AGC costa 50 k€ (en tens ${Math.round(this.telemetry.budgetEuros)} k€).`, true);
          return false;
        }
        node.hasAutoFrequencyRegulation = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - 50) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#06B6D4', 'CONVERTER');
        this.notify(`🤖 Regulador AGC instal·lat i actiu a ${node.name}! Auto-regularà la potència contínuament per clavar la xarxa als 50,00 Hz.`, false);
        return true;

      case 'SOLAR_TRACKERS':
        if (node.hasSolarTrackers) {
          this.notify(`⚠️ ${node.name} ja compta amb seguidors solars!`, true);
          return false;
        }
        node.hasSolarTrackers = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#F59E0B', 'CONVERTER');
        this.notify(`☀️ Seguidors solars a 1 eix instal·lats a ${node.name}! +25% de producció matí i tarda.`, false);
        return true;

      case 'WIND_LOW_SPEED':
        if (node.hasLowWindBlades) {
          this.notify(`⚠️ ${node.name} ja compta amb pales per a brises febles!`, true);
          return false;
        }
        node.hasLowWindBlades = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#0284C7', 'CONVERTER');
        this.notify(`💨 Pales eòliques de baixa velocitat instal·lades a ${node.name}! Genera des de 7 km/h (+20%).`, false);
        return true;

      case 'HYDRO_PELTON':
        if (node.hasHydroPeltonUpgrade) {
          this.notify(`⚠️ ${node.name} ja disposa de turbines Pelton millorades!`, true);
          return false;
        }
        node.hasHydroPeltonUpgrade = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#06B6D4', 'CONVERTER');
        this.notify(`🌊 Turbines Pelton instal·lades a ${node.name}! +20% capacitat de turbinació ràpida.`, false);
        return true;

      case 'GAS_HYDROGEN':
        if (node.hasGasHydrogenMix) {
          this.notify(`⚠️ ${node.name} ja disposa d'hibridació d'hidrogen verd!`, true);
          return false;
        }
        node.hasGasHydrogenMix = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'ABSORB');
        this.notify(`🧪 Hibridació amb Hidrogen Verd instal·lada a ${node.name}! Emissions de CO₂ retallades un -40%.`, false);
        return true;

      case 'NUCLEAR_UPRATE':
        if (node.hasNuclearUprate) {
          this.notify(`⚠️ ${node.name} ja disposa d'actualització tèrmica de nucli!`, true);
          return false;
        }
        node.hasNuclearUprate = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#A855F7', 'CONVERTER');
        this.notify(`⚛️ Actualització tèrmica de nucli finalitzada a ${node.name}! +10% potència base neta.`, false);
        return true;

      case 'BIOMASS_GASIFIER':
        if (node.hasBiomassGasifier) {
          this.notify(`⚠️ ${node.name} ja compta amb gasificador d'alta eficiència!`, true);
          return false;
        }
        node.hasBiomassGasifier = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#22C55E', 'CONVERTER');
        this.notify(`🪵 Gasificador d'alta eficiència i cogeneració instal·lat a ${node.name}! +20% potència de base renovable.`, false);
        return true;

      case 'V2G_CHARGING':
        if (node.hasV2G) {
          this.notify(`⚠️ ${node.name} ja disposa de tecnologia Vehicle-to-Grid!`, true);
          return false;
        }
        node.hasV2G = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#6366F1', 'CONVERTER');
        this.notify(`🚗 Sistema Vehicle-to-Grid (V2G) instal·lat a ${node.name}! -25% pic crític del vespre.`, false);
        return true;

      case 'SMART_LED':
        if (node.hasSmartLED) {
          this.notify(`⚠️ ${node.name} ja compta amb enllumenat públic intel·ligent LED!`, true);
          return false;
        }
        node.hasSmartLED = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#F59E0B', 'CONVERTER');
        this.notify(`💡 Enllumenat públic intel·ligent LED instal·lat a ${node.name}! -20% consum nocturn.`, false);
        return true;

      case 'HEAT_RECOVERY':
        if (node.hasHeatRecovery) {
          this.notify(`⚠️ ${node.name} ja compta amb recuperació de calor residual!`, true);
          return false;
        }
        node.hasHeatRecovery = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#14B8A6', 'ABSORB');
        this.notify(`🔄 Recuperació de calor i cogeneració instal·lada a ${node.name}! -25% demanda elèctrica i -30% emissions.`, false);
        return true;

      case 'GAS_GREEN_H2_100':
        if (node.hasGreenHydrogen100) {
          this.notify(`⚠️ ${node.name} ja opera al 100% amb Hidrogen Verd i Biometà!`, true);
          return false;
        }
        node.hasGreenHydrogen100 = true;
        node.hasGasHydrogenMix = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#10B981', 'CONVERTER');
        this.notify(`💚 Reconversió 100% Hidrogen Verd completada a ${node.name}! Ara genera amb 0 g CO₂/kWh i 0 multes ETS!`, false);
        return true;

      case 'PORT_ELECTRIFICATION':
        if (node.hasPortElectrification) {
          this.notify(`⚠️ ${node.name} ja compta amb electrificació de molls i ferrocarril!`, true);
          return false;
        }
        node.hasPortElectrification = true;
        this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;
        this.spawnParticle(node.pos.x, node.pos.y, '#06B6D4', 'CONVERTER');
        this.notify(`🚢 Electrificació de Molls (Cold Ironing) i Ferrocarril activa a ${node.name}! -30% consum i 0 emissions directes.`, false);
        return true;
    }
    return false;
  }

  setGeneratorThrottle(nodeId: string, throttle: number) {
    const node = this.nodes.find(n => n.id === nodeId && n.type === 'GENERATOR');
    if (node) {
      node.throttle = Math.max(0, Math.min(1.0, throttle));
      node.gasThrottle = node.throttle;
      if (node.generatorType === 'GAS_COMBINED') {
        node.isGasActive = node.throttle > 0.01;
      }
    }
  }

  setHydroMode(nodeId: string, mode: HydroMode) {
    const node = this.nodes.find(n => n.id === nodeId && n.generatorType === 'HYDRO_PUMP');
    if (node) {
      const isReversibleCapable = node.id === 'gen-hydro-pallars' || Boolean(node.hasHydroPeltonUpgrade);
      if (mode === 'PUMPING' && !isReversibleCapable) {
        this.notify(`💧 ${node.name} és una central d'embassament convencional (a diferència de Sallente-Estany Gento, que és reversible de naixement). Instal·la el 'Grup Turbina-Bomba Reversible i Pelton' (75 k€) per habilitar el bombament invers!`, true);
        return;
      }
      node.hydroMode = mode;
      const modeNames: Record<HydroMode, string> = {
        AUTO: 'Automàtic (Smart Grid)',
        PUMPING: `⬆️ Bombament Actiu (Absorbint ~${Math.round(node.nominalPower * 0.5)} MW de la xarxa per omplir l'estany superior)`,
        TURBINING: '⚡ Turbinació (Generació neta)',
        TURBO: '🚀 Mode Turbo (140% Potència de Pic)',
      };
      this.notify(`💧 ${node.name}: ${modeNames[mode]}`, false);
    }
  }

  toggleIndustrialDemandResponse(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId && (n.consumerType === 'INDUSTRIAL' || n.id === 'cons-zona-franca'));
    if (!node) return;
    node.isInterrupted = !node.isInterrupted;
    if (node.isInterrupted) {
      // Small economic payment / fee for shedding industrial load
      this.telemetry.budgetEuros = Math.max(0, Math.round((this.telemetry.budgetEuros - 15) * 10) / 10);
      this.notify(`🛑 INTERROMPIBILITAT ACTIVADA a ${node.name}: Consum reduït un 85% per protegir les ciutats (-15 k€ compensació).`, false);
    } else {
      this.notify(`🏭 ${node.name}: Represa de producció industrial normal (100% càrrega).`, false);
    }
  }

  setDifficulty(diff: GameDifficulty) {
    this.telemetry.difficulty = diff;
  }

  isFranceInterconnConnected(): boolean {
    return this.lines.some(
      l => !l.isTripped && l.voltage === 'MAT' && l.nodeIds.includes('sub-figueres-franca')
    );
  }

  interconnExportToFrance() {
    if (!this.isFranceInterconnConnected()) {
      this.notify("🔒 Mercat bloquejat! Cal connectar la Subestació de Santa Llogaia / Figueres amb MAT 400 kV per activar la interconnexió amb França.", true);
      return;
    }
    if (this.telemetry.interconnFlowMW < 0) {
      this.telemetry.interconnFlowMW = 0;
      this.notify("🇫🇷 Interconnexió amb França en mode Neutre (0 MW).", false);
      return;
    }
    this.internationalTradesCount++;
    this.telemetry.interconnFlowMW = -300; // Exporting 300 MW out of Catalonia continuously until toggled off
    this.notify(`🇫🇷 Exportació MAT contínua a França ACTIVADA (-300 MW d'excedent evacuats cap a Baixas; ingressant divises segons preu spot). Torna a clicar per aturar.`, false);
  }

  interconnImportFromFrance() {
    if (!this.isFranceInterconnConnected()) {
      this.notify("🔒 Mercat bloquejat! Cal connectar la Subestació de Santa Llogaia / Figueres amb MAT 400 kV per activar la interconnexió amb França.", true);
      return;
    }
    if (this.telemetry.interconnFlowMW > 0) {
      this.telemetry.interconnFlowMW = 0;
      this.notify("🇫🇷 Interconnexió amb França en mode Neutre (0 MW).", false);
      return;
    }
    if (this.telemetry.budgetEuros < 10) {
      this.notify(`⚠️ Pressupost insuficient per iniciar la importació d'energia des de França.`, true);
      return;
    }
    this.internationalTradesCount++;
    this.telemetry.interconnFlowMW = 300; // Importing 300 MW into Catalonia continuously until toggled off
    this.notify(`🇫🇷 Importació MAT contínua des de França ACTIVADA (+300 MW injectats des de Baixas). Torna a clicar per aturar.`, false);
  }

  buyMarketItem(item: MarketItemType): boolean {
    if (item === 'INTERCONN_EXPORT') {
      this.interconnExportToFrance();
      return true;
    }
    if (item === 'INTERCONN_IMPORT') {
      this.interconnImportFromFrance();
      return true;
    }

    const costs: Record<MarketItemType, number> = {
      BUY_BATTERY: 120,
      BUY_MAT_KM: 60,
      BUY_DIST_KM: 45,
      BUY_REINFORCE: 90,
      BUY_SMART_METER: 80,
      BUY_ROOFTOP_SOLAR: 70,
      BUY_INSULATION: 75,
      BUY_ECO_FILTERS: 85,
      BUY_HOSPITAL_SAI: 65,
      INTERCONN_EXPORT: 0,
      INTERCONN_IMPORT: 0,
    };

    const cost = costs[item];
    if (this.telemetry.budgetEuros < cost) {
      this.notify(`⚠️ Pressupost insuficient! Necessites ${cost} k€ (tens ${Math.round(this.telemetry.budgetEuros)} k€).`, true);
      return false;
    }

    this.telemetry.budgetEuros = Math.round((this.telemetry.budgetEuros - cost) * 10) / 10;

    switch (item) {
      case 'BUY_BATTERY':
        this.inventory.batteriesTotal += 1;
        this.notify("🔋 Has comprat +1 Bateria BESS! (Usa la Tecla 4 per instal·lar-la a una Subestació)", false);
        break;
      case 'BUY_MAT_KM':
        this.inventory.matKmTotal += 80;
        this.notify("⚡ Has adquirit +80 km de cable d'alta tensió MAT 400 kV!", false);
        break;
      case 'BUY_DIST_KM':
        this.inventory.distKmTotal += 80;
        this.notify("🔌 Has adquirit +80 km de cable de distribució urbana 25 kV!", false);
        break;
      case 'BUY_REINFORCE':
        this.inventory.reinforcedLinesTotal += 1;
        for (const line of this.lines) {
          if (!line.isReinforced) {
            line.isReinforced = true;
            line.maxCapacity *= CONFIG.REINFORCED_MULTIPLIER;
          }
        }
        this.notify("💪 Cables reforçats amb més gruix (secció): Ara suporten el doble de potència (x2)!", false);
        break;
      case 'BUY_SMART_METER': {
        this.inventory.smartMeteringTotal += 1;
        const city = this.nodes.find(n => n.consumerType === 'RESIDENTIAL' && !n.hasSmartMetering);
        if (city) {
          city.hasSmartMetering = true;
          this.notify(`📱 Comptadors intel·ligents instal·lats a ${city.name} (-30% demanda punta per estalvi a les llars)!`, false);
        } else {
          this.notify("📱 Totes les ciutats actuals ja tenen comptadors intel·ligents!", false);
        }
        break;
      }
      case 'BUY_ROOFTOP_SOLAR': {
        const candidate = this.nodes.find(n => n.consumerType === 'RESIDENTIAL' && !n.hasRooftopSolar);
        if (candidate) {
          candidate.hasRooftopSolar = true;
          this.notify(`☀️ Autoconsum solar col·lectiu a ${candidate.name}! Redueix fins a un 35% la demanda d'energia de la xarxa en hores de sol.`, false);
        } else {
          this.notify("☀️ Totes les poblacions residencials ja compten amb autoconsum solar!", false);
        }
        break;
      }
      case 'BUY_INSULATION': {
        const candidate = this.nodes.find(n => n.consumerType === 'RESIDENTIAL' && !n.hasThermalInsulation);
        if (candidate) {
          candidate.hasThermalInsulation = true;
          this.notify(`🏢 Aïllament tèrmic Passivhaus a ${candidate.name}! Redueix un 20% el consum elèctric de calefacció i climatització.`, false);
        } else {
          this.notify("🏢 Tots els municipis ja disposen d'aïllament tèrmic Passivhaus!", false);
        }
        break;
      }
      case 'BUY_ECO_FILTERS': {
        const candidate = this.nodes.find(n => (n.consumerType === 'INDUSTRIAL' || n.id === 'cons-petroquimic') && !n.hasEcoFilters);
        if (candidate) {
          candidate.hasEcoFilters = true;
          this.notify(`🌱 Filtres industrials ecològics a ${candidate.name}! Reducció del 70% d'emissions de CO₂ i penalitzacions ETS.`, false);
        } else {
          this.notify("🌱 Totes les indústries ja disposen de filtres ecològics avançats!", false);
        }
        break;
      }
      case 'BUY_HOSPITAL_SAI': {
        const candidate = this.nodes.find(n => (n.id.includes('hospital') || n.consumerType === 'CRITICAL') && !n.hasHospitalMicrogrid);
        if (candidate) {
          candidate.hasHospitalMicrogrid = true;
          candidate.maxOverloadTime = 45;
          candidate.overloadTimer = 45;
          this.notify(`🏥 Microxarxa i SAIs a ${candidate.name}! Ara disposa de bateries d'emergència i 45 segons de marge davant fallades.`, false);
        } else {
          this.notify("🏥 Tots els hospitals i centres crítics ja disposen de microxarxes de seguretat!", false);
        }
        break;
      }
    }
    return true;
  }

  setGasPlantThrottle(nodeId: string, throttle: number) {
    this.setGeneratorThrottle(nodeId, throttle);
  }

  toggleGasPlant(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId && n.generatorType === 'GAS_COMBINED');
    if (node) {
      if (node.isGasActive) {
        node.isGasActive = false;
        node.gasThrottle = 0;
        this.notify(`🛑 ${node.name}: Central aturada (0 MW - 0 CO₂)`, false);
      } else {
        node.isGasActive = true;
        node.gasThrottle = 0.65;
        this.notify(`🔥 ${node.name}: Central engegada al 65% (559 MW)`, false);
      }
    }
  }

  applyUpgrade(type: UpgradeType) {
    switch (type) {
      case 'NEW_MAT_LINE':
        this.inventory.matKmTotal += 300;
        this.notify("⚡ +300 km de Cable MAT 400 kV afegits a l'inventari!", false);
        break;
      case 'BATTERY':
        this.inventory.batteriesTotal += 2;
        this.notify("🔋 +2 Bateries de Liti BESS afegides a l'inventari!", false);
        break;
      case 'REINFORCED_LINE':
        this.inventory.reinforcedLinesTotal += 1;
        for (const line of this.lines) {
          if (!line.isReinforced) {
            line.isReinforced = true;
            line.maxCapacity *= CONFIG.REINFORCED_MULTIPLIER;
          }
        }
        this.notify("💪 Línies reforçades amb conductors d'alta capacitat!", false);
        break;
      case 'NEW_DIST_LINE':
        this.inventory.distKmTotal += 250;
        this.notify("🔌 +250 km de Cable de Distribució 25 kV afegits!", false);
        break;
      case 'SMART_METERING':
        this.inventory.smartMeteringTotal += 1;
        const city = this.nodes.find(n => n.consumerType === 'RESIDENTIAL' && !n.hasSmartMetering);
        if (city) city.hasSmartMetering = true;
        this.notify("📡 Comptadors intel·ligents instal·lats (-15% consum a ciutat)!", false);
        break;
    }

    this.isWeeklyUpgradePending = false;
    this.isPaused = false;
  }
}
