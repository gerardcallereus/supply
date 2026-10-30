export interface I18nDictionary {
  appTitle: string;
  appSubtitle: string;
  frequency: string;
  co2Emissions: string;
  co2Limit: string;
  generation: string;
  demand: string;
  renewables: string;
  matLine: string;
  distLine: string;
  substation: string;
  battery: string;
  tower: string;
  towersAvailable: string;
  linesAvailable: string;
  day: string;
  days: string;
  weekdays: string[];
  weatherWind: string;
  weatherSolar: string;
  jouleEffectDesc: string;
  overloadWarning: string;
  blackoutWarning: string;
  gasSwitchOn: string;
  gasSwitchOff: string;
  gasEmitsCo2: string;
  hydroPumping: string;
  hydroGenerating: string;
  hydroStorage: string;
  batteryStorage: string;
  instructionsTitle: string;
  close: string;
  pause: string;
  resume: string;
  speed: string;
  weeklyUpgradeTitle: string;
  weeklyUpgradeSubtitle: string;
  selectUpgrade: string;
  gameOverTitle: string;
  retry: string;
  educationalFeedback: string;
  blackoutExplanation: string;
  climateExplanation: string;
  overfrequencyExplanation?: string;
  statsTitle: string;
  daysSurvived: string;
  energyDelivered: string;
  avgRenewables: string;
  freqStability: string;
  language: string;
  highVoltageExplain: string;
  distVoltageExplain: string;
  needSubstationExplain: string;
  riverCrossingExplain: string;
  upgrades: {
    NEW_MAT_LINE_title: string;
    NEW_MAT_LINE_desc: string;
    BATTERY_title: string;
    BATTERY_desc: string;
    REINFORCED_LINE_title: string;
    REINFORCED_LINE_desc: string;
    NEW_DIST_LINE_title: string;
    NEW_DIST_LINE_desc: string;
    SMART_METERING_title: string;
    SMART_METERING_desc: string;
  };
  nodeTooltips: {
    nuclear: string;
    solar: string;
    wind: string;
    hydro: string;
    gas: string;
    substation: string;
    residential: string;
    industrial: string;
    critical: string;
  };
}

export const I18N_TEXTS: Record<'ca' | 'es', I18nDictionary> = {
  ca: {
    appTitle: "Supply",
    appSubtitle: "Simulador educatiu de la xarxa elèctrica catalana",
    frequency: "Freqüència de Xarxa",
    co2Emissions: "Emissions de CO₂",
    co2Limit: "Límit d'Emissions",
    generation: "Generació",
    demand: "Demanda",
    renewables: "Renovables",
    matLine: "Línia MAT (400 kV)",
    distLine: "Distribució (25 kV)",
    substation: "Subestació",
    battery: "Bateria de Liti",
    tower: "Torres / Soterraments",
    towersAvailable: "Torres de pas disponibles",
    linesAvailable: "Cables disponibles",
    day: "Dia",
    days: "dies",
    weekdays: ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"],
    weatherWind: "Vent",
    weatherSolar: "Radiació Solar",
    jouleEffectDesc: "Pèrdues tèrmiques per Efecte Joule (P = I² · R). Si la distància o el corrent és excessiu, l'energia es dissipa en forma de calor.",
    overloadWarning: "Línia sobrecarregada! El magnetotèrmic s'ha disparat per protegir el cable.",
    blackoutWarning: "Dèficit crític d'energia! Risc d'apagada imminent.",
    gasSwitchOn: "ACTIVAT (Generant + CO₂)",
    gasSwitchOff: "PARAT (0 MW - Clic per activar)",
    gasEmitsCo2: "Crema de gas natural: 450 g CO₂ / kWh generat.",
    hydroPumping: "Bombant aigua al pantà superior (emmagatzemant energia sobrant)",
    hydroGenerating: "Turbinant aigua ràpidament per salvar el pic de demanda",
    hydroStorage: "Reserva hidràulica",
    batteryStorage: "Càrrega de bateria",
    instructionsTitle: "Com funciona la Xarxa Elèctrica?",
    close: "Tancar",
    pause: "Pausa",
    resume: "Continuar",
    speed: "Velocitat",
    weeklyUpgradeTitle: "Millores de la Xarxa (Diumenge)",
    weeklyUpgradeSubtitle: "Enhorabona! Has completat una setmana mantenint l'estabilitat del sistema elèctric. Tria 1 millora tecnològica:",
    selectUpgrade: "Instal·lar millora",
    gameOverTitle: "Fi de la Simulació",
    retry: "Tornar a intentar",
    educationalFeedback: "Anàlisi Pedagògica del Sistema",
    blackoutExplanation: "APAGADA GENERAL (Blackout): El node consumidor ha acumulat més de 8 paquets de demanda insatisfeta durant massa temps. Quan la demanda supera la generació o la capacitat dels cables, la freqüència cau per sota dels límits de seguretat (< 49.0 Hz) i els sistemes de protecció desconnecten la xarxa per evitar danys catastròfics.",
    climateExplanation: "EMERGÈNCIA CLIMÀTICA (Excés de CO₂): S'ha superat el llindar ecològic màxim d'emissions. S'ha abusat de les centrals tèrmiques de cicle combinat de gas en lloc de dimensionar correctament les renovables (solar i eòlica) i el bombament hidroeléctric.",
    overfrequencyExplanation: "DISPARAMENT PER SOBREFREQÜÈNCIA (> 50.50 Hz): S'ha generat molta més electricitat de la que Catalunya consumia sense bateries BESS suficients ni bombament a Sallente/Susqueda. L'acceleració incontrolada dels generadors ha fet saltar els relés de sobrevelocitat del sistema.",
    statsTitle: "Mètriques de Rendiment",
    daysSurvived: "Dies completats",
    energyDelivered: "Energia neta lliurada",
    avgRenewables: "Mitjana renovable",
    freqStability: "Freqüència mitjana",
    language: "Idioma",
    highVoltageExplain: "Molt Alta Tensió (MAT 400 kV): Transporta grans quantitats d'energia des de grans centrals a les subestacions amb pèrdues mínimes.",
    distVoltageExplain: "Distribució (25 kV): Porta l'electricitat des de les subestacions fins a les ciutats i indústries. Té pèrdues per Efecte Joule si els cables són massa llargs.",
    needSubstationExplain: "Per transportar electricitat de MAT a consumidors residencials o industrials, cal passar per una Subestació Transformadora!",
    riverCrossingExplain: "Creuar un riu o la serralada dels Pirineus requereix torres especials de gran alçada o soterraments d'alta capacitat.",
    upgrades: {
      NEW_MAT_LINE_title: "+300 km Cable MAT (400 kV)",
      NEW_MAT_LINE_desc: "Afegeix 300 km de línia de transport d'alta tensió per evacuar l'energia de grans centrals.",
      BATTERY_title: "+2 Bateries de Liti BESS",
      BATTERY_desc: "Emmagatzema excedents solars al migdia i descarrega automàticament durant el pic del vespre (19:00 - 22:00).",
      REINFORCED_LINE_title: "Cablejat Reforçat (Secció Doble)",
      REINFORCED_LINE_desc: "Duplica la capacitat d'evacuació de les línies existents evitant el sobreescalfament tèrmic.",
      NEW_DIST_LINE_title: "+250 km Cable Distribució (25 kV)",
      NEW_DIST_LINE_desc: "Afegeix 250 km de cable de mitja tensió per alimentar noves ciutats, hospitals i polígons.",
      SMART_METERING_title: "Smart Metering (Gestió Intel·ligent)",
      SMART_METERING_desc: "Comptadors intel·ligents per reduir la demanda punta un 15% a les àrees residencials.",
    },
    nodeTooltips: {
      nuclear: "Central Nuclear (Ascó / Vandellòs): Gran producció síncrona de base 24h (~55% del mix actual català) sense emissions directes de CO₂. Alta inèrcia tèrmica (regulació lenta).",
      solar: "Agrupació Fotovoltaica Comarcal (Horitzó PROENCAT 2030): Genera entre les 08:00 i les 19:00 (pic al migdia solar). Clau per superar el dèficit històric de grans parcs solars a Catalunya.",
      wind: "Parc Eòlic: Producció variable lligada a la velocitat del vent (Tramuntana, Mestral, Marinada) segons la corba cúbica de potència. Zero emissions.",
      hydro: "Central Hidroelèctrica: Sallente-Estany Gento és reversible pura de bombeig (absorbeix excedents bombant aigua a l'estany superior); Sau-Susqueda i Cledes són d'embassament i regulació pirinenca.",
      gas: "Cicle Combinat (Gas Natural): Central tèrmica ràpida de suport síncron. Emet 450 g CO₂/kWh (reduïble amb Hidrogen Verd). Imprescindible quan cau el sol o el vent si no hi ha bateries.",
      substation: "Subestació Transformadora (Redeia): Transforma l'alta tensió de transport (400 kV MAT) a mitja tensió de distribució (25 kV) per reduir les pèrdues per Efecte Joule (P = I²·R).",
      residential: "Consumidor Residencial: Corba horària amb pic matinal (08:00) i gran punta nocturna (19:00 - 22:00 quan ja no hi ha sol).",
      industrial: "Polígon Industrial: Alta demanda contínua o per torns i emissions de procés (química, automoció, logística). Admet gestió d'Interrompibilitat i Cogeneració.",
      critical: "Infraestructura Crítica: Hospitals d'alta complexitat i sistemes de navegació aèria. No admeten talls (temps de reserva a la meitat sense SAI!).",
    }
  },
  es: {
    appTitle: "Supply",
    appSubtitle: "Simulador educativo de la red eléctrica catalana",
    frequency: "Frecuencia de Red",
    co2Emissions: "Emisiones de CO₂",
    co2Limit: "Límite de Emisiones",
    generation: "Generación",
    demand: "Demanda",
    renewables: "Renovables",
    matLine: "Línea MAT (400 kV)",
    distLine: "Distribución (25 kV)",
    substation: "Subestación",
    battery: "Batería de Litio",
    tower: "Torres / Soterramientos",
    towersAvailable: "Torres de cruce disponibles",
    linesAvailable: "Cables disponibles",
    day: "Día",
    days: "días",
    weekdays: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
    weatherWind: "Viento",
    weatherSolar: "Radiación Solar",
    jouleEffectDesc: "Pérdidas térmicas por Efecto Joule (P = I² · R). Si la distancia o la corriente es excesiva, la energía se disipa en forma de calor.",
    overloadWarning: "¡Línea sobrecargada! El magnetotérmico ha saltado para proteger el cable.",
    blackoutWarning: "¡Déficit crítico de energía! Riesgo de apagón inminente.",
    gasSwitchOn: "ACTIVADO (Generando + CO₂)",
    gasSwitchOff: "PARADO (0 MW - Clic para activar)",
    gasEmitsCo2: "Quema de gas natural: 450 g CO₂ / kWh generado.",
    hydroPumping: "Bombeando agua al embalse superior (almacenando excedente)",
    hydroGenerating: "Turbinando agua velozmente para salvar el pico de demanda",
    hydroStorage: "Reserva hidráulica",
    batteryStorage: "Carga de batería",
    instructionsTitle: "¿Cómo funciona la Red Eléctrica?",
    close: "Cerrar",
    pause: "Pausa",
    resume: "Reanudar",
    speed: "Velocidad",
    weeklyUpgradeTitle: "Mejoras de la Red (Domingo)",
    weeklyUpgradeSubtitle: "¡Enhorabuena! Has completado una semana manteniendo la estabilidad del sistema eléctrico. Escoge 1 mejora tecnológica:",
    selectUpgrade: "Instalar mejora",
    gameOverTitle: "Fin de la Simulación",
    retry: "Reintentar",
    educationalFeedback: "Análisis Pedagógico del Sistema",
    blackoutExplanation: "APAGÓN GENERAL (Blackout): El nodo consumidor ha acumulado más de 8 huecos de demanda insatisfecha durante demasiado tiempo. Cuando la demanda supera la generación o la capacidad de las líneas, la frecuencia cae por debajo de los límites seguros (< 49.0 Hz) y los relés de protección desconectan la red para evitar averías catastróficas.",
    climateExplanation: "EMERGENCIA CLIMÁTICA (Exceso de CO₂): Se ha superado el umbral ecológico de emisiones. Se ha abusado de las centrales de ciclo combinado de gas en vez de dimensionar y gestionar las renovables (solar y eólica) y el almacenamiento reversible.",
    statsTitle: "Métricas de Rendimiento",
    daysSurvived: "Días completados",
    energyDelivered: "Energía neta entregada",
    avgRenewables: "Media renovable",
    freqStability: "Frecuencia media",
    language: "Idioma",
    highVoltageExplain: "Muy Alta Tensión (MAT 400 kV): Transporta grandes paquetes de energía desde grandes centrales a subestaciones con pérdidas mínimas.",
    distVoltageExplain: "Distribución (25 kV): Lleva la electricidad desde subestaciones a ciudades e industrias. Sufre pérdidas por Efecto Joule si las distancias son largas.",
    needSubstationExplain: "Para transportar electricidad de MAT a consumidores residenciales o industriales, ¡es imprescindible pasar por una Subestación!",
    riverCrossingExplain: "Cruzar un río o la cordillera pirenaica requiere torres especiales de gran envergadura o soterramientos técnicos.",
    upgrades: {
      NEW_MAT_LINE_title: "+1 Línea MAT (400 kV) + Subestación",
      NEW_MAT_LINE_desc: "Añade una nueva línea de transporte de alta capacidad y una subestación transformadora para enlazar más comarcas.",
      BATTERY_title: "Batería de Litio Grid-Scale",
      BATTERY_desc: "Almacena excedentes fotovoltaicos a mediodía (solar) y descarga automáticamente en el pico de consumo nocturno.",
      REINFORCED_LINE_title: "Cableado Reforzado (Sección Doble)",
      REINFORCED_LINE_desc: "Duplica la intensidad máxima admisible (I_max) de una línea, evitando disparos del magnetotérmico por sobrecalentamiento.",
      NEW_DIST_LINE_title: "+250 km Cable Distribución (25 kV)",
      NEW_DIST_LINE_desc: "Añade 250 km de cable de media tensión para alimentar nuevas ciudades y polígonos.",
      SMART_METERING_title: "Smart Metering (Gestión Inteligente)",
      SMART_METERING_desc: "Aplica contadores inteligentes a una ciudad para aplanar un 30% su pico de consumo nocturno.",
    },
    nodeTooltips: {
      nuclear: "Central Nuclear: Gran producción de base 24h sin emisiones directes de CO₂. No modulable de forma rápida.",
      solar: "Parque Solar: Genera solo entre las 08:00 y las 19:00 (máximo al mediodía solar).",
      wind: "Parque Eólico: Producción sujeta a la velocidad del viento (rachas y calmas). Sin emisiones.",
      hydro: "Hidroeléctrica Reversible: Almacenamiento masivo. Bombea agua con excedentes y turbina con déficit.",
      gas: "Ciclo Combinado (Gas): Central térmica de respaldo rápido. Emite 450 g CO₂/kWh. Clic para encender/apagar.",
      substation: "Subestación: Transforma la tensión de 400 kV (MAT) a 25 kV (Distribución) haciéndola apta para ciudades.",
      residential: "Consumidor Residencial: Pico matutino (08:00) y gran pico nocturno (19:00 - 22:00 sin sol).",
      industrial: "Consumidor Industrial: Gran demanda eléctrica y emisiones de proceso (química, siderurgia). Reducible un 85% con la gestión de Interrumpibilidad.",
      critical: "Infraestructura Crítica: Hospitales y aeropuertos. Tolerancia a fallos a la mitad (¡alerta roja rápida!).",
    }
  }
};
