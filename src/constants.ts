export const CONFIG = {
  // Day / Night cycle: 1 day = 45 real seconds
  SECONDS_PER_DAY: 45,
  DAYS_PER_WEEK: 7,
  
  // Grid Frequency
  TARGET_FREQUENCY_HZ: 50.0,
  MAX_FREQ_DEVIATION: 1.2, // 48.8 Hz to 51.2 Hz
  
  // Energy packets
  PACKET_SIZE_MWH: 50, // Each energy packet represents 50 MWh
  PACKET_SPEED_MAT: 260, // pixels per second on Canvas
  PACKET_SPEED_DIST: 165, // pixels per second
  PACKET_RADIUS: 5.5,
  
  // Power Lines
  LINE_WIDTH_MAT: 8,
  LINE_WIDTH_DIST: 4.5,
  MAX_PACKETS_MAT: 14,
  MAX_PACKETS_DIST: 7,
  REINFORCED_MULTIPLIER: 2,
  CIRCUIT_BREAKER_TRIP_TIME_SEC: 5.0, // Inactive for 5 seconds on overload
  
  // Joule losses
  JOULE_LOSS_PROB_PER_100PX_DIST: 0.05, // 5% chance per 100px in distribution lines
  JOULE_LOSS_PROB_PER_100PX_MAT: 0.003, // Only 0.3% in MAT lines
  
  // CO2 Emissions
  GAS_CO2_GRAMS_PER_PACKET: 22500, // 450 g/kWh * 50,000 kWh = 22.5 kg CO2 per 50 MWh packet
  INITIAL_CO2_LIMIT_KG: 12000,     // 12 tonnes limit for Level 1, calibrated so emissions are dynamic and visible
  
  // Node Radii
  NODE_RADIUS_LARGE: 22,
  NODE_RADIUS_MEDIUM: 17,
  NODE_RADIUS_SMALL: 13,
  
  // Geographic scale: 1 coordinate unit ≈ 0.25 km in Catalonia
  KM_PER_COORD_UNIT: 0.25,
  
  // Starting assets (cable in real kilometers and grid batteries)
  STARTING_MAT_KM: 120,
  STARTING_DIST_KM: 100,
  STARTING_BATTERIES: 2,
};

// Colors inspired by Mini Metro's iconic minimalist design
export const THEME = {
  day: {
    bg: '#F5F2EB',
    landFill: '#ECE6D9',
    landStroke: '#D4CCBD',
    water: '#B4D2E7',
    waterDeep: '#9ABFD9',
    pyreneesFill: '#DDD6C6',
    pyreneesStroke: '#C4BBA7',
    gridText: '#374151',
    nodeStroke: '#1F2937',
    nodeFill: '#FFFFFF',
    textMuted: '#6B7280',
    ghostLine: 'rgba(55, 65, 81, 0.4)',
  },
  night: {
    bg: '#12161F',
    landFill: '#18202C',
    landStroke: '#253246',
    water: '#18293B',
    waterDeep: '#111D2A',
    pyreneesFill: '#202A3B',
    pyreneesStroke: '#2E3D55',
    gridText: '#E2E8F0',
    nodeStroke: '#FFFFFF',
    nodeFill: '#1E293B',
    textMuted: '#94A3B8',
    ghostLine: 'rgba(255, 255, 255, 0.4)',
  },
  
  // Node and Line Colors
  nodes: {
    nuclear: '#8B5CF6',     // Purple Hexagon
    solar: '#EAB308',       // Yellow Circle
    wind: '#3B82F6',        // Blue Triangle
    hydro: '#06B6D4',       // Cyan Diamond
    gas: '#F97316',         // Orange Square
    substation: '#E2E8F0',  // White/Silver Substation
    residential: '#10B981', // Emerald Double Circle / House
    industrial: '#6366F1',  // Indigo Gear / Box
    critical: '#EF4444',    // Red Cross
  },
  
  lines: {
    mat: '#EA580C',         // Vivid Red-Orange for 400 kV MAT
    matGlow: 'rgba(234, 88, 12, 0.35)',
    dist: '#0284C7',        // Cyan-Blue for 25 kV Distribution
    distGlow: 'rgba(2, 132, 199, 0.3)',
    tripped: '#EF4444',     // Blinking red for tripped circuit breaker
  },
  
  packets: {
    mat: '#FFF7ED',
    matBorder: '#EA580C',
    dist: '#F0F9FF',
    distBorder: '#0284C7',
    sparks: ['#FBBF24', '#F97316', '#EF4444', '#FFFFFF'],
  }
};
