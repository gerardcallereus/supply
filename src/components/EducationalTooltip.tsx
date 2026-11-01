import React from 'react';
import { 
  GridNode, 
  PowerLine, 
  Language, 
  ToolMode, 
  Point, 
  Inventory, 
  NodeUpgradeType, 
  LineVoltage,
  HydroMode 
} from '../types';
import { I18N_TEXTS } from '../i18n';
import { CONFIG } from '../constants';
import { 
  Zap, 
  AlertTriangle, 
  Wind, 
  Sun, 
  Battery, 
  ShieldAlert, 
  Cpu, 
  Activity, 
  Scissors, 
  CheckCircle2, 
  Building, 
  Flame,
  X,
  Sliders,
  Droplets,
  Radio,
  Check
} from 'lucide-react';

interface EducationalTooltipProps {
  hoverNode: GridNode | null;
  selectedNode?: GridNode | null;
  onDeselectNode?: () => void;
  hoverLine: PowerLine | null;
  lines?: PowerLine[];
  nodes?: GridNode[];
  onRemoveLine?: (lineId: string) => void;
  onReinforceLine?: (lineId: string) => void;
  onRemoveBattery?: (nodeId: string) => void;
  dragState: {
    isDragging: boolean;
    startNode: GridNode | null;
    currentWorldPos: Point | null;
  } | null;
  selectedTool: ToolMode;
  lang: Language;
  budgetEuros: number;
  inventory: Inventory;
  onInstallNodeUpgrade: (nodeId: string, upgradeType: NodeUpgradeType) => boolean;
  onBuyCable: (voltage: LineVoltage) => void;
  onToggleDemandResponse?: (nodeId: string) => void;
  onSetGeneratorThrottle?: (nodeId: string, throttle: number) => void;
  onSetHydroMode?: (nodeId: string, mode: HydroMode) => void;
}

export const EducationalTooltip: React.FC<EducationalTooltipProps> = ({
  hoverNode,
  selectedNode,
  onDeselectNode,
  hoverLine,
  lines = [],
  nodes = [],
  onRemoveLine,
  onReinforceLine,
  onRemoveBattery,
  dragState,
  selectedTool,
  lang,
  budgetEuros,
  inventory,
  onInstallNodeUpgrade,
  onBuyCable,
  onToggleDemandResponse,
  onSetGeneratorThrottle,
  onSetHydroMode,
}) => {
  const t = I18N_TEXTS[lang];

  const matAvailable = inventory.matKmTotal - inventory.matKmUsed;
  const distAvailable = inventory.distKmTotal - inventory.distKmUsed;

  // IMPORTANT: When a node is selected (clicked), the panel is PINNED and MUST NOT change when hovering other nodes!
  const isPinned = !!selectedNode;
  const activeNode = selectedNode || hoverNode;

  // Helper to render Cable Inventory & Purchase Card at the bottom of the left column
  const renderCableInventoryCard = () => (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-3.5 pointer-events-auto text-xs w-full shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>📏</span>
          <span>Reserva de Cables (Finit)</span>
        </h4>
        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {Math.round(budgetEuros)} k€
        </span>
      </div>

      <div className="space-y-2">
        {/* Línia MAT 400 kV */}
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1.5 truncate">
              <span>⚡</span>
              <span>MAT (400 kV)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {matAvailable} km disponibles
            </div>
          </div>
          <button
            onClick={() => onBuyCable('MAT')}
            disabled={budgetEuros < 60}
            className="shrink-0 px-2.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-mono font-bold text-xs cursor-pointer transition-all shadow-xs"
            title="Compra +80 km de cable MAT 400 kV (60 k€)"
          >
            +80 km (60 k€)
          </button>
        </div>

        {/* Línia Distribució 25 kV */}
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1.5 truncate">
              <span>🔌</span>
              <span>Distribució (25 kV)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {distAvailable} km disponibles
            </div>
          </div>
          <button
            onClick={() => onBuyCable('DISTRIBUTION')}
            disabled={budgetEuros < 45}
            className="shrink-0 px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-mono font-bold text-xs cursor-pointer transition-all shadow-xs"
            title="Compra +80 km de cable de distribució urbana 25 kV (45 k€)"
          >
            +80 km (45 k€)
          </button>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // 1. ACTIVE CONSTRUCTION INSPECTOR (WHEN DRAGGING A CABLE)
  // =========================================================================
  if (dragState?.isDragging && dragState.startNode && dragState.currentWorldPos) {
    const startNode = dragState.startNode;
    const isMAT = selectedTool === 'MAT';
    const distPx = Math.hypot(
      dragState.currentWorldPos.x - startNode.pos.x,
      dragState.currentWorldPos.y - startNode.pos.y
    );
    const distKm = Math.max(3, Math.round(distPx * CONFIG.KM_PER_COORD_UNIT));
    const layingCost = Math.round(distKm * (isMAT ? 0.35 : 0.20) * 10) / 10;
    const lossPct = isMAT ? (distKm * 0.015).toFixed(1) : (distKm * 0.08).toFixed(1);

    // Cable stock & rules validation
    let validation = { ok: true, msg: 'Arrossega fins a la destinació i deixa anar per establir connexió.', isPending: true };
    const cableAvail = isMAT ? matAvailable : distAvailable;
    if (distKm > cableAvail) {
      validation = { ok: false, msg: `Reserva de cable insuficient (Necessites ${distKm} km, et queden ${cableAvail} km).`, isPending: false };
    } else if (layingCost > budgetEuros) {
      validation = { ok: false, msg: `Pressupost insuficient per a l'obra civil (Cost: ${layingCost} k€, Disposes de: ${Math.round(budgetEuros)} k€).`, isPending: false };
    }

    return (
      <aside className="fixed top-20 left-4 bottom-24 w-84 sm:w-96 max-w-[calc(100vw-2rem)] z-30 flex flex-col gap-3 pointer-events-auto overflow-y-auto pr-1 animate-fade-in font-sans">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 text-xs w-full">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs ${
                isMAT ? 'bg-gradient-to-tr from-orange-500 to-amber-600' : 'bg-gradient-to-tr from-sky-500 to-blue-600'
              }`}>
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h2 className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">
                  Traçat de Línia Elèctrica
                </h2>
                <span className={`text-[10px] font-bold font-mono ${isMAT ? 'text-orange-600 dark:text-orange-400' : 'text-sky-600 dark:text-sky-400'}`}>
                  {isMAT ? 'Molt Alta Tensió (MAT 400 kV)' : 'Distribució Urbana (25 kV)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
              📏 {distKm} km
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 mb-2 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Origen:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">{startNode.name}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-1 mt-1">
              <span className="text-slate-400">Cost d'obra civil:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{layingCost} k€</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pèrdues Joule:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">~{lossPct}%</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl text-xs leading-relaxed font-sans border flex items-start gap-2 ${
            validation.isPending 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              : validation.ok 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium' 
                : 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300 font-bold'
          }`}>
            <span className="shrink-0 text-base">{validation.ok ? (validation.isPending ? '🔍' : '✅') : '⚠️'}</span>
            <span>{validation.msg}</span>
          </div>
        </div>

        {renderCableInventoryCard()}
      </aside>
    );
  }

  // =========================================================================
  // 2. ACTIVE NODE INSPECTOR & UPGRADES PANEL
  // =========================================================================
  if (activeNode) {
    let typeDesc = '';
    let badgeGradient = 'from-blue-500 to-indigo-600';
    let icon = <Zap className="w-4 h-4 fill-white" />;
    let typeLabel = 'Instal·lació';

    if (activeNode.type === 'GENERATOR') {
      typeLabel = 'Central de Generació';
      switch (activeNode.generatorType) {
        case 'NUCLEAR':
          typeDesc = t.nodeTooltips.nuclear;
          badgeGradient = 'from-purple-600 to-indigo-700';
          icon = <Cpu className="w-4 h-4" />;
          break;
        case 'SOLAR':
          typeDesc = t.nodeTooltips.solar;
          badgeGradient = 'from-amber-400 to-orange-500';
          icon = <Sun className="w-4 h-4" />;
          break;
        case 'WIND':
          typeDesc = t.nodeTooltips.wind;
          badgeGradient = 'from-sky-400 to-blue-600';
          icon = <Wind className="w-4 h-4" />;
          break;
        case 'HYDRO_PUMP':
          typeDesc = t.nodeTooltips.hydro;
          badgeGradient = 'from-cyan-500 to-teal-600';
          icon = <Battery className="w-4 h-4" />;
          break;
        case 'GAS_COMBINED':
          typeDesc = t.nodeTooltips.gas;
          badgeGradient = 'from-orange-500 to-red-600';
          icon = <ShieldAlert className="w-4 h-4" />;
          break;
        case 'BIOMASS':
          typeDesc = "Generació renovable i gestionable 24h a partir de neteja forestal (prevenció d'incendis) i biometà de purins. Aporta estabilitat de xarxa i economia circular sense cap emissió fòssil neta.";
          badgeGradient = 'from-emerald-600 to-green-700';
          icon = <Flame className="w-4 h-4" />;
          break;
      }
    } else if (activeNode.type === 'SUBSTATION') {
      typeLabel = 'Subestació Transformadora';
      typeDesc = t.nodeTooltips.substation;
      badgeGradient = 'from-slate-600 to-slate-800';
      icon = <Zap className="w-4 h-4 fill-white" />;
    } else if (activeNode.type === 'CONSUMER') {
      switch (activeNode.consumerType) {
        case 'RESIDENTIAL':
          typeLabel = 'Àrea Residencial';
          typeDesc = t.nodeTooltips.residential;
          badgeGradient = 'from-emerald-500 to-teal-600';
          break;
        case 'INDUSTRIAL':
          typeLabel = 'Polígon Industrial';
          typeDesc = t.nodeTooltips.industrial;
          badgeGradient = 'from-indigo-500 to-blue-700';
          break;
        case 'CRITICAL':
          typeLabel = 'Infraestructura Crítica';
          typeDesc = t.nodeTooltips.critical;
          badgeGradient = 'from-red-500 to-rose-700';
          icon = <AlertTriangle className="w-4 h-4" />;
          break;
      }
    }

    const currentThrottlePct = Math.round(
      (activeNode.throttle !== undefined
        ? activeNode.throttle
        : activeNode.generatorType === 'GAS_COMBINED'
          ? (activeNode.isGasActive ? 0.65 : 0)
          : 1.0) * 100
    );

    return (
      <aside className="fixed top-20 left-4 bottom-24 w-84 sm:w-96 max-w-[calc(100vw-2rem)] z-30 flex flex-col gap-3 pointer-events-auto overflow-y-auto pr-1 animate-fade-in font-sans">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 text-xs w-full">
          
          {/* BANER DE NODE FIXAT (SI S'HA FET CLIC) */}
          {isPinned ? (
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-indigo-500/20 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                <span>📌</span>
                <span>Panell de Gestió i Control</span>
              </span>
              <button
                onClick={onDeselectNode}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                title="Desfixar selecció (o clica fora)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Desfixar</span>
              </button>
            </div>
          ) : (
            <div className="pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Passant el ratolí (Fes clic per gestionar)</span>
              <span>👆 Clica per gestionar</span>
            </div>
          )}

          {/* Header del Node */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${badgeGradient} flex items-center justify-center text-white shadow-xs shrink-0`}>
                {icon}
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold leading-tight text-slate-800 dark:text-slate-100 truncate">
                  {activeNode.name}
                </h2>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {typeLabel}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold truncate shrink-0">
              {activeNode.comarca}
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-2.5">
            {typeDesc}
          </p>

          {/* Telemetria bàsica en temps real */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl font-mono text-[11px] mb-3 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Potència</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeNode.currentPower} MW</span>
              <span className="text-slate-400 text-[10px]"> / {activeNode.nominalPower} MW</span>
            </div>

            {activeNode.type === 'CONSUMER' && (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Demanda pendent</span>
                <span className={`font-bold ${activeNode.demandSlots > 4 ? 'text-red-500 font-extrabold' : 'text-slate-700 dark:text-slate-200'}`}>
                  {activeNode.demandSlots} / {activeNode.maxDemandSlots} paquets
                </span>
              </div>
            )}

            {activeNode.consumerType === 'INDUSTRIAL' && (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">CO₂ Procés</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {activeNode.hasEcoFilters ? '🌱 -70% Net' : '💨 100% Emissor'}
                </span>
              </div>
            )}

            {activeNode.type === 'SUBSTATION' && (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Cua transformador</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{activeNode.generationQueue || 0} / 8 paquets</span>
              </div>
            )}

            {activeNode.generatorType === 'GAS_COMBINED' && (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Rendiment Turbina</span>
                <span className={`font-bold ${activeNode.isGasActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                  {Math.round((activeNode.gasThrottle !== undefined ? activeNode.gasThrottle : (activeNode.isGasActive ? 0.65 : 0)) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* POSSIBLES MILLORES I EFECTES ESPECÍFICS D'AQUEST NODE          */}
          {/* =============================================================== */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-500" />
                <span>Gestió i Millores de la Instal·lació</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Saldo: {Math.round(budgetEuros)} k€
              </span>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* A. MILLORES PER A MUNICIPIS I CIUTATS (RESIDENCIAL)            */}
            {/* ------------------------------------------------------------- */}
            {activeNode.consumerType === 'RESIDENTIAL' && (
              <div className="space-y-2">
                {/* 1. Autoconsum Solar a Teulades */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasRooftopSolar 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>☀️</span>
                      <span>Autoconsum Solar a Teulades</span>
                    </div>
                    {activeNode.hasRooftopSolar ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'ROOFTOP_SOLAR')}
                        disabled={budgetEuros < 70}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        70 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Instal·la plaques solars a terrats del municipi. <strong>Redueix un -35% el consum elèctric de dia (10h-18h)</strong>, descongestionant les línies de transport.
                  </p>
                </div>

                {/* 2. Aïllament Tèrmic Passivhaus */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasThermalInsulation 
                    ? 'bg-teal-500/10 border-teal-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🏢</span>
                      <span>Aïllament Tèrmic Passivhaus</span>
                    </div>
                    {activeNode.hasThermalInsulation ? (
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'INSULATION')}
                        disabled={budgetEuros < 75}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        75 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Rehabilitació de façanes i dobles vidres. Aporta un <strong>estalvi permanent del -20% d'energia</strong> en calefacció i aire condicionat durant tot l'any.
                  </p>
                </div>

                {/* 3. Comptadors Intel·ligents */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasSmartMetering 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>📱</span>
                      <span>Comptadors Intel·ligents</span>
                    </div>
                    {activeNode.hasSmartMetering ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'SMART_METER')}
                        disabled={budgetEuros < 80}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        80 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Telemesura i tarifes dinàmiques horàries. <strong>Retalla un -30% el pic crític del vespre (19h-22h)</strong> fomentant el trasllat d'ús a hores vall.
                  </p>
                </div>

                {/* 4. Càrrega Bidireccional V2G (Vehicle-to-Grid) */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasV2G 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🚗</span>
                      <span>Vehicle-to-Grid (V2G)</span>
                    </div>
                    {activeNode.hasV2G ? (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'V2G_CHARGING')}
                        disabled={budgetEuros < 70}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        70 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Connexió bidireccional dels cotxes elèctrics ciutadans. <strong>Abaixa un -25% addicional el pic del vespre (19h-22h)</strong> utilitzant les bateries dels cotxes aparcats.
                  </p>
                </div>

                {/* 5. Enllumenat Públic Intel·ligent LED */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasSmartLED 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Enllumenat Públic LED Intel·ligent</span>
                    </div>
                    {activeNode.hasSmartLED ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'SMART_LED')}
                        disabled={budgetEuros < 50}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        50 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Fanals LED municipals regulats per sensors. <strong>Estalvia un -20% del consum nocturn (21h-06h)</strong> a tota la trama urbana.
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* B. MILLORES PER A LA GRAN INDÚSTRIA I POLÍGONS                 */}
            {/* ------------------------------------------------------------- */}
            {activeNode.consumerType === 'INDUSTRIAL' && (
              <div className="space-y-2">
                {/* 1. Filtres Verds & Captura CO2 */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasEcoFilters 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🌱</span>
                      <span>Filtres Verds & Captura CO₂</span>
                    </div>
                    {activeNode.hasEcoFilters ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'ECO_FILTERS')}
                        disabled={budgetEuros < 85}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        85 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Electrificació neta de processos químics i filtratge ecològic. <strong>Retalla un -70% el CO₂ industrial</strong>, evitant sancions climàtiques i l'alerta ambiental.
                  </p>
                </div>

                {/* 2. Recuperació de Calor i Cogeneració */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasHeatRecovery 
                    ? 'bg-teal-500/10 border-teal-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🔄</span>
                      <span>Recuperació de Calor & Cogeneració</span>
                    </div>
                    {activeNode.hasHeatRecovery ? (
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'HEAT_RECOVERY')}
                        disabled={budgetEuros < 75}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        75 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Captura de calor residual de forns i reaccions químiques. <strong>Redueix un -25% el consum d'energia de la xarxa</strong> i retalla un -30% les emissions de procés.
                  </p>
                </div>

                {/* 2b. Electrificació de Molls (Cold Ironing) i Ferrocarril Elèctric */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasPortElectrification 
                    ? 'bg-cyan-500/10 border-cyan-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🚢</span>
                      <span>Electrificació de Molls & Ferrocarril</span>
                    </div>
                    {activeNode.hasPortElectrification ? (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'PORT_ELECTRIFICATION')}
                        disabled={budgetEuros < 95}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        95 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Connexió elèctrica de vaixells i mercaderies ferroviàries (OPS). <strong>Redueix un -30% el consum i elimina el 100% d'emissions directes</strong> del recinte.
                  </p>
                </div>

                {/* 3. Interrompibilitat Industrial Directa */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.isInterrupted 
                    ? 'bg-rose-500/15 border-rose-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🛑</span>
                      <span>Interrompibilitat Industrial</span>
                    </div>
                    {onToggleDemandResponse && (
                      <button
                        onClick={() => onToggleDemandResponse(activeNode.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs ${
                          activeNode.isInterrupted
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500/20'
                        }`}
                      >
                        {activeNode.isInterrupted ? 'Reprendre' : 'Interrompre'}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Permet <strong>aturar el 85% del consum de maquinària pesada</strong> en moments crítics de dèficit energètic per salvar Catalunya d'una apagada general.
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* C. MILLORES PER A HOSPITALS I INFRAESTRUCTURES CRÍTIQUES       */}
            {/* ------------------------------------------------------------- */}
            {(activeNode.consumerType === 'CRITICAL' || activeNode.id.includes('hospital')) && (
              <div className="space-y-2">
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasHospitalMicrogrid 
                    ? 'bg-rose-500/10 border-rose-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🏥</span>
                      <span>Microxarxa SAI d'Emergència</span>
                    </div>
                    {activeNode.hasHospitalMicrogrid ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Actiu
                      </span>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'HOSPITAL_SAI')}
                        disabled={budgetEuros < 65}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                      >
                        65 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Sistemes d'Alimentació Ininterrompuda (SAI) d'emergència per a cures intensives i quiròfans. <strong>Atorga +45 segons de protecció absoluta</strong> davant d'apagades.
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* D. BATERIES BESS PER A SUBESTACIONS I CONSUMIDORS              */}
            {/* ------------------------------------------------------------- */}
            {(activeNode.type === 'SUBSTATION' || activeNode.type === 'CONSUMER') && (
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 transition-all">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🔋</span>
                      <span>Mòdul BESS de Liti ({activeNode.batteryCount || (activeNode.hasBattery ? 1 : 0)} actius)</span>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                      Capacitat màxima: {activeNode.type === 'SUBSTATION' ? '6 mòduls' : '4 mòduls'}
                    </div>
                  </div>
                  {(() => {
                    const availableBatteries = Math.max(0, inventory.batteriesTotal - inventory.batteriesUsed);
                    const curBess = activeNode.batteryCount || (activeNode.hasBattery ? 1 : 0);
                    const maxBess = activeNode.type === 'SUBSTATION' ? 6 : 4;
                    const canInstall = curBess < maxBess && (availableBatteries > 0 || budgetEuros >= 120);
                    return (
                      <div className="flex items-center gap-1 shrink-0">
                        {curBess > 0 && onRemoveBattery && (
                          <button
                            onClick={() => onRemoveBattery(activeNode.id)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs font-mono transition-all cursor-pointer"
                            title="Retira 1 mòdul BESS i retorna'l a l'inventari"
                          >
                            -1
                          </button>
                        )}
                        <button
                          onClick={() => onInstallNodeUpgrade(activeNode.id, 'BATTERY')}
                          disabled={!canInstall}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                          title={availableBatteries > 0 ? "Instal·la un mòdul des de l'inventari (de franc)" : "Compra i instal·la un mòdul nou per 120 k€"}
                        >
                          {curBess >= maxBess ? 'Màx.' : availableBatteries > 0 ? `+1 BESS (${availableBatteries} disp.)` : '+1 BESS (120 k€)'}
                        </button>
                      </div>
                    );
                  })()}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Què suposa:</strong> Bateries de reacció ultraràpida. <strong>Injecten potència en mil·lisegons quan la freqüència baixa de 50 Hz</strong> i emmagatzemen excedents renovables.
                </p>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* E. REGULACIÓ DIRECTA SI ÉS CENTRAL DE GENERACIÓ                */}
            {/* ------------------------------------------------------------- */}
            {activeNode.type === 'GENERATOR' && (
              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>Regulació de Potència Activa</span>
                  </span>
                  <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                    {currentThrottlePct}% ({activeNode.currentPower} MW)
                  </span>
                </div>

                {onSetGeneratorThrottle && (
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentThrottlePct}
                      onChange={(e) => onSetGeneratorThrottle(activeNode.id, Number(e.target.value) / 100)}
                      className="w-full accent-amber-500 h-2 cursor-pointer bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => onSetGeneratorThrottle(activeNode.id, 0)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                          currentThrottlePct === 0 ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        0% (Aturar)
                      </button>
                      <button
                        onClick={() => onSetGeneratorThrottle(activeNode.id, 0.5)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                          currentThrottlePct === 50 ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        50%
                      </button>
                      <button
                        onClick={() => onSetGeneratorThrottle(activeNode.id, 1.0)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                          currentThrottlePct === 100 ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        100%
                      </button>
                    </div>
                  </div>
                )}

                {/* Millora d'Auto-Regulació de Freqüència (AGC - 50 Hz) */}
                <div className={`p-2.5 rounded-xl border transition-all ${
                  activeNode.hasAutoFrequencyRegulation 
                    ? 'bg-cyan-500/15 border-cyan-500/35' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🤖</span>
                      <span>Regulador Automàtic AGC (50 Hz)</span>
                    </div>
                    {activeNode.hasAutoFrequencyRegulation ? (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'AUTO_FREQUENCY_AGC')}
                        className="px-2 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] font-mono flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Fes clic per desactivar o activar l'AGC automàtic"
                      >
                        <Check className="w-3 h-3" /> Auto Actiu
                      </button>
                    ) : (
                      <button
                        onClick={() => onInstallNodeUpgrade(activeNode.id, 'AUTO_FREQUENCY_AGC')}
                        disabled={budgetEuros < 50}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                        title="Instal·la el sistema AGC perquè reguli la potència de forma autònoma"
                      >
                        50 k€
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Què suposa:</strong> Control Automàtic de Generació (AGC). Aquesta central <strong>ajusta automàticament la potència en temps real (puja o baixa sola)</strong> per contrarestar els canvis del consum, el sol i el vent, clavant la xarxa als 50,00 Hz exactes.
                  </p>
                </div>

                {/* Millora específica per a Centrals Solars */}
                {activeNode.generatorType === 'SOLAR' && (
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    activeNode.hasSolarTrackers 
                      ? 'bg-amber-500/15 border-amber-500/35' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>☀️</span>
                        <span>Seguidors Solars a 1 Eix</span>
                      </div>
                      {activeNode.hasSolarTrackers ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Actiu
                        </span>
                      ) : (
                        <button
                          onClick={() => onInstallNodeUpgrade(activeNode.id, 'SOLAR_TRACKERS')}
                          disabled={budgetEuros < 60}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                        >
                          60 k€
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong>Què suposa:</strong> Orienta els mòduls seguint la trajectòria del sol. <strong>Augmenta la generació matinal i de la tarda un +25%</strong>, ampliant la corba solar diària.
                    </p>
                  </div>
                )}

                {/* Millora específica per a Parcs Eòlics */}
                {activeNode.generatorType === 'WIND' && (
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    activeNode.hasLowWindBlades 
                      ? 'bg-emerald-500/15 border-emerald-500/35' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>💨</span>
                        <span>Pales Eòliques de Baixa Velocitat</span>
                      </div>
                      {activeNode.hasLowWindBlades ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Actiu
                        </span>
                      ) : (
                        <button
                          onClick={() => onInstallNodeUpgrade(activeNode.id, 'WIND_LOW_SPEED')}
                          disabled={budgetEuros < 65}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                        >
                          65 k€
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong>Què suposa:</strong> Pales aerodinàmiques de fibra de carboni. <strong>Permet generar energia fins i tot amb brises febles (des de 7 km/h)</strong> i incrementa la potència un +20%.
                    </p>
                  </div>
                )}

                {/* Millora específica per a Hidroelèctriques Reversibles */}
                {activeNode.generatorType === 'HYDRO_PUMP' && (
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    activeNode.hasHydroPeltonUpgrade 
                      ? 'bg-cyan-500/15 border-cyan-500/35' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>🌊</span>
                        <span>Grup Turbina-Bomba Reversible i Pelton</span>
                      </div>
                      {activeNode.hasHydroPeltonUpgrade ? (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-[10px] font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Actiu
                        </span>
                      ) : (
                        <button
                          onClick={() => onInstallNodeUpgrade(activeNode.id, 'HYDRO_PELTON')}
                          disabled={budgetEuros < 75}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                        >
                          75 k€
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong>Què suposa:</strong> {activeNode.id === 'gen-hydro-pallars' ? "Sallente-Estany Gento ja és reversible de naixement; aquesta millora hi afegeix rotors Pelton d'alta pressió (+20% potència)." : "Habilita el bombament invers d'aigua cap a l'embassament superior per absorbir excedents solars/nuclears i suma +20% de potència de turbinació."}
                    </p>
                  </div>
                )}

                {/* Millora específica per a Cicles Combinats de Gas */}
                {activeNode.generatorType === 'GAS_COMBINED' && (
                  <div className="space-y-2">
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      activeNode.hasGasHydrogenMix 
                        ? 'bg-teal-500/15 border-teal-500/35' 
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>🧪</span>
                          <span>Hibridació amb Hidrogen Verd (20%)</span>
                        </div>
                        {activeNode.hasGasHydrogenMix ? (
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-[10px] font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> Actiu
                          </span>
                        ) : (
                          <button
                            onClick={() => onInstallNodeUpgrade(activeNode.id, 'GAS_HYDROGEN')}
                            disabled={budgetEuros < 80}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                          >
                            80 k€
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong>Què suposa:</strong> Barreja un 20% d'hidrogen renovable a la cambra de combustió. <strong>Retalla un -40% les emissions de CO₂ generades</strong>.
                      </p>
                    </div>

                    <div className={`p-2.5 rounded-xl border transition-all ${
                      activeNode.hasGreenHydrogen100 
                        ? 'bg-emerald-500/15 border-emerald-500/35' 
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>💚</span>
                          <span>Reconversió 100% H₂ Verd / Biometà</span>
                        </div>
                        {activeNode.hasGreenHydrogen100 ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> 0 CO₂
                          </span>
                        ) : (
                          <button
                            onClick={() => onInstallNodeUpgrade(activeNode.id, 'GAS_GREEN_H2_100')}
                            disabled={budgetEuros < 140}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                          >
                            140 k€
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong>Què suposa:</strong> Projecte PROENCAT 2030 de descarbonització tèrmica total. Substitueix el gas fòssil per 100% Hidrogen Verd i Biometà: <strong>0 g CO₂/kWh i 0 multes ETS!</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Millora específica per a Centrals Nuclears */}
                {activeNode.generatorType === 'NUCLEAR' && (
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    activeNode.hasNuclearUprate 
                      ? 'bg-purple-500/15 border-purple-500/35' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>⚛️</span>
                        <span>Actualització Tèrmica de Nucli (Uprate)</span>
                      </div>
                      {activeNode.hasNuclearUprate ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-[10px] font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Actiu
                        </span>
                      ) : (
                        <button
                          onClick={() => onInstallNodeUpgrade(activeNode.id, 'NUCLEAR_UPRATE')}
                          disabled={budgetEuros < 90}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                        >
                          90 k€
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong>Què suposa:</strong> Optimització del cicle de vapor d'alta eficiència. <strong>Augmenta la potència base neta un +10%</strong> sense generar cap emissió contaminant.
                    </p>
                  </div>
                )}

                {/* Millora específica per a Centrals de Biomassa i Biogàs */}
                {activeNode.generatorType === 'BIOMASS' && (
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    activeNode.hasBiomassGasifier 
                      ? 'bg-emerald-500/15 border-emerald-500/35' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>🪵</span>
                        <span>Gasificador d'Alta Eficiència & Cogeneració</span>
                      </div>
                      {activeNode.hasBiomassGasifier ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Actiu
                        </span>
                      ) : (
                        <button
                          onClick={() => onInstallNodeUpgrade(activeNode.id, 'BIOMASS_GASIFIER')}
                          disabled={budgetEuros < 60}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs font-mono transition-all shadow-xs cursor-pointer"
                        >
                          60 k€
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong>Què suposa:</strong> Tecnologia de gasificació i cicle combinat de biogàs. <strong>Augmenta la potència un +20%</strong> de forma contínua i genera calor residual per a xarxes urbanes de districte.
                    </p>
                  </div>
                )}

                {/* Si és Cicle Combinat de Gas: Impacte en CO2 */}
                {activeNode.generatorType === 'GAS_COMBINED' && (
                  <p className="text-[11px] text-orange-700 dark:text-orange-300 leading-relaxed border-t border-amber-500/25 pt-1.5">
                    <strong>Avís Ambiental:</strong> Crema gas natural i genera CO₂. Aturar-la en moments de vent o sol estalvia emissions i frena l'alerta climàtica.
                  </p>
                )}

                {/* Si és Hidroelèctrica Reversible: Selector de mode */}
                {activeNode.generatorType === 'HYDRO_PUMP' && onSetHydroMode && (
                  <div className="pt-2 border-t border-cyan-500/25">
                    <div className="text-[10px] font-bold text-cyan-800 dark:text-cyan-300 mb-1 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        <span>Embassament: {Math.round(activeNode.hydroStorage || 0)}%</span>
                      </span>
                      {(activeNode.hydroPumpingLoadMW || 0) > 0 && (
                        <span className="text-sky-600 dark:text-sky-400 font-mono">
                          ⬆️ Bombant (-{activeNode.hydroPumpingLoadMW} MW)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      {(['AUTO', 'PUMPING', 'TURBINING', 'TURBO'] as HydroMode[]).map((mode) => {
                        const active = (activeNode.hydroMode || 'AUTO') === mode;
                        const labels: Record<HydroMode, string> = {
                          AUTO: 'Auto',
                          PUMPING: 'Bombeig',
                          TURBINING: 'Turbina',
                          TURBO: 'Turbo',
                        };
                        return (
                          <button
                            key={mode}
                            onClick={() => onSetHydroMode(activeNode.id, mode)}
                            className={`py-1 rounded font-bold transition-colors cursor-pointer ${
                              active ? 'bg-cyan-600 text-white shadow-xs' : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20'
                            }`}
                          >
                            {labels[mode]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* F. LÍNIES CONNECTADES A AQUEST NODE (DESMANTELLAR AMB 70% RETORN) */}
            {/* ------------------------------------------------------------- */}
            {(() => {
              const nodeLines = lines.filter(l => l.nodeIds.includes(activeNode.id));
              if (nodeLines.length === 0) return null;
              return (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-rose-500" />
                      <span>Línies connectades ({nodeLines.length})</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Retorn 70% k€</span>
                  </div>
                  <div className="space-y-1">
                    {nodeLines.map(line => {
                      const otherId = line.nodeIds.find(id => id !== activeNode.id);
                      const otherNode = nodes.find(n => n.id === otherId);
                      const isMAT = line.voltage === 'MAT';
                      const layingCost = Math.round(line.lengthKm * (isMAT ? 0.35 : 0.20) * 10) / 10;
                      const refund = Math.round(layingCost * 0.70 * 10) / 10;
                      const reinforceCost = Math.max(20, Math.round(line.lengthKm * (isMAT ? 0.25 : 0.15)));
                      return (
                        <div
                          key={line.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1.5 text-[11px]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              ↔ {otherNode ? otherNode.name : otherId}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                              <span className={isMAT ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-sky-600 dark:text-sky-400 font-bold'}>
                                {isMAT ? 'MAT 400kV' : 'Dist 25kV'}
                              </span>
                              <span>• {line.lengthKm} km</span>
                              {line.isReinforced && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                                  💪 Doble x2
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!line.isReinforced && onReinforceLine && (
                              <button
                                onClick={() => onReinforceLine(line.id)}
                                disabled={budgetEuros < reinforceCost}
                                className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] transition-colors cursor-pointer"
                                title={`Reforça en Doble Circuit (x2 capacitat i immune a la Tramuntana) per ${reinforceCost} k€`}
                              >
                                💪 x2 ({reinforceCost} k€)
                              </button>
                            )}
                            {onRemoveLine && (
                              <button
                                onClick={() => onRemoveLine(line.id)}
                                className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                                title={`Desmantella aquesta línia: recupera ${line.lengthKm} km de cable i +${refund} k€`}
                              >
                                <Scissors className="w-3 h-3" />
                                <span>+{refund} k€</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {renderCableInventoryCard()}
      </aside>
    );
  }

  // =========================================================================
  // 3. LINE HOVER INSPECTOR
  // =========================================================================
  if (hoverLine) {
    const isMAT = hoverLine.voltage === 'MAT';
    return (
      <aside className="fixed top-20 left-4 bottom-24 w-84 sm:w-96 max-w-[calc(100vw-2rem)] z-30 flex flex-col gap-3 pointer-events-auto overflow-y-auto pr-1 animate-fade-in font-sans">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 text-xs w-full">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs ${
                isMAT ? 'bg-gradient-to-tr from-orange-500 to-amber-600' : 'bg-gradient-to-tr from-sky-500 to-blue-600'
              }`}>
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h2 className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">
                  {isMAT ? 'Línia de Molt Alta Tensió' : 'Línia de Distribució'}
                </h2>
                <span className={`text-[10px] font-bold font-mono ${isMAT ? 'text-orange-600 dark:text-orange-400' : 'text-sky-600 dark:text-sky-400'}`}>
                  {isMAT ? '400 kV (MAT)' : '25 kV (Distribució)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
              📏 {hoverLine.lengthKm} km
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-2.5">
            {isMAT ? t.highVoltageExplain : t.distVoltageExplain}
          </p>

          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl font-mono text-[11px] mb-2 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Flux Elèctric</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {hoverLine.currentPacketsCount} / {hoverLine.maxCapacity} paquets
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Secció del Cable</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {hoverLine.isReinforced ? '💪 Doble Circuit (x2)' : 'Circuit Simple'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
            <Scissors className="w-3.5 h-3.5 shrink-0" />
            <span><strong>Consell:</strong> Clic dret per desmuntar, o clica un dels seus nodes per reforçar-la en Doble Circuit (x2).</span>
          </div>
        </div>

        {renderCableInventoryCard()}
      </aside>
    );
  }

  // =========================================================================
  // 4. STANDBY INSPECTOR CARD (LEFT COLUMN)
  // =========================================================================
  return (
    <aside className="fixed top-20 left-4 bottom-24 w-84 sm:w-96 max-w-[calc(100vw-2rem)] z-30 flex flex-col gap-3 pointer-events-auto overflow-y-auto pr-1 animate-fade-in font-sans">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 text-xs w-full">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
              Panell de Gestió i Control
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Fes clic a qualsevol node per gestionar-lo
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs leading-relaxed space-y-2">
          <p>
            Fes <strong>clic sobre qualsevol ciutat, central, subestació o polígon</strong> per fixar-ne el panell informatiu i instal·lar-hi millores d'estalvi o eficiència:
          </p>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 space-y-1">
            <div>☀️ <strong>Ciutats:</strong> Autoconsum Solar, Passivhaus i Comptadors</div>
            <div>🌱 <strong>Indústria:</strong> Filtres Verds de CO₂ i Interrompibilitat</div>
            <div>🏥 <strong>Hospitals:</strong> Microxarxa SAI d'Emergència (+45s)</div>
            <div>🔋 <strong>Subestacions:</strong> Mòduls BESS de Liti per als 50 Hz</div>
          </div>
        </div>
      </div>

      {renderCableInventoryCard()}
    </aside>
  );
};
