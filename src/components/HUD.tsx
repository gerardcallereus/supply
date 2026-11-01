import React, { useState } from 'react';
import { GameTelemetry, WeatherState, Inventory, ToolMode, GridNode, HydroMode, MarketItemType } from '../types';
import { I18N_TEXTS } from '../i18n';
import { MixDonutChart } from './MixDonutChart';
import { 
  Play, 
  Pause, 
  Sun, 
  Wind, 
  Zap, 
  HelpCircle, 
  Battery, 
  Activity, 
  Flame,
  Scissors,
  Layers,
  Sliders,
  Trophy,
  Coins,
  Lock,
  Cable,
  Smartphone
} from 'lucide-react';

interface HUDProps {
  currentLevel: number;
  telemetry: GameTelemetry;
  weather: WeatherState;
  inventory: Inventory;
  nodes: GridNode[];
  selectedTool: ToolMode;
  onSelectTool: (t: ToolMode) => void;
  speed: number;
  onSetSpeed: (s: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenTutorial: () => void;
  onSetGeneratorThrottle: (nodeId: string, throttle: number) => void;
  onSetHydroMode: (nodeId: string, mode: HydroMode) => void;
  onBuyMarketItem: (item: MarketItemType) => void;
  onToggleDemandResponse: (nodeId: string) => void;
  onSetDifficulty: (diff: any) => void;
  isFranceConnected?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  currentLevel,
  telemetry,
  weather,
  inventory,
  nodes,
  selectedTool,
  onSelectTool,
  speed,
  onSetSpeed,
  isPaused,
  onTogglePause,
  onOpenTutorial,
  onSetGeneratorThrottle,
  onSetHydroMode,
  onBuyMarketItem,
  onToggleDemandResponse,
  isFranceConnected = false,
}) => {
  const t = I18N_TEXTS.ca;

  const [showCompletedMissions, setShowCompletedMissions] = useState(false);

  // Format hours: 14.5 -> "14:30"
  const hours = Math.floor(telemetry.dayTimeHours);
  const minutes = Math.floor((telemetry.dayTimeHours - hours) * 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const weekdayName = t.weekdays[telemetry.dayOfWeek];

  // Frequency status color (50 Hz)
  const freqDiff = Math.abs(telemetry.gridFrequency - 50.0);
  const freqColor = freqDiff < 0.15 
    ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' 
    : freqDiff < 0.40 
      ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' 
      : 'text-red-500 border-red-500/40 bg-red-500/20 font-bold';

  // CO2 limit progress (0 to 100%)
  const co2Pct = Math.min(100, Math.round((telemetry.co2EmissionsAccumulated / telemetry.co2MaxLimit) * 100));

  let co2Badge = { text: '🟢 Aire Netejat', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' };
  if (telemetry.co2AlertLevel === 'EMERGENCY') {
    co2Badge = { text: '🔴 ALERTA CLIMÀTICA', style: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 font-bold' };
  } else if (telemetry.co2AlertLevel === 'EPISODE') {
    co2Badge = { text: '🟠 Episodi Contaminació', style: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40' };
  } else if (telemetry.co2AlertLevel === 'PREVENTIVE') {
    co2Badge = { text: '🟡 Avís Preventiu', style: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' };
  }

  const matAvailable = inventory.matKmTotal - inventory.matKmUsed;
  const distAvailable = inventory.distKmTotal - inventory.distKmUsed;
  const batteriesAvailable = inventory.batteriesTotal - inventory.batteriesUsed;

  const criticalConsumer = nodes.find(n => n.type === 'CONSUMER' && n.isCriticalAlarm);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. HEADER SUPERIOR TOTAL (OCUPA TOTA L'HORITZONTAL DE BANDA A BANDA)        */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 w-full h-16 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-md select-none text-slate-800 dark:text-slate-100">
        
        {/* SECCIÓ ESQUERRA: MARCA, NIVELL, PERFIL I TEMPS */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold leading-none text-slate-900 dark:text-white tracking-tight">
                  Supply
                </h1>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold font-mono px-2 py-0.5 bg-amber-500/15 rounded-md border border-amber-500/20">
                  Nivell {currentLevel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                <span>{weekdayName} {timeString}</span>
                <span className="text-slate-400">• Dia {telemetry.dayCount}</span>
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

          {/* Medalla Fixa del Mode (Sense botons de canvi al mig del joc) */}
          <div className="hidden md:flex items-center">
            {telemetry.difficulty === 'AULA' ? (
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5" title="Mode Aula: Proteccions didàctiques automàtiques">
                <span>🎓</span>
                <span>Mode Aula</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1.5" title="Mode Operador: Simulació estricta i física professional">
                <span>⚡</span>
                <span>Operador</span>
              </span>
            )}
          </div>

          {/* Controls de Pausa i Velocitat */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={onTogglePause}
              className={`p-1.5 rounded-lg transition-colors ${
                isPaused ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isPaused ? "Reprendre (Espai)" : "Pausa (Espai)"}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => onSetSpeed(1)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                !isPaused && speed === 1 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => onSetSpeed(2)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                !isPaused && speed === 2 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              2x
            </button>
          </div>

          <button
            onClick={onOpenTutorial}
            className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Guia Didàctica i Física de la Xarxa Elèctrica"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
          </button>
        </div>

        {/* SECCIÓ CENTRAL: FREQÜÈNCIA (50 Hz), BALANÇ MW I METEOROLOGIA */}
        <div className="flex items-center gap-3">
          {/* Freqüència de Sincronisme (50.00 Hz) */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-sm sm:text-base font-mono shadow-sm ${freqColor}`} title="Freqüència de la xarxa elèctrica (Objectiu: 50.00 Hz)">
            <Activity className="w-4 h-4 shrink-0" />
            <span>{telemetry.gridFrequency.toFixed(2)} Hz</span>
            {telemetry.gridFrequency >= 50.40 && (
              <span className="text-xs text-rose-500 animate-ping">⚠️</span>
            )}
          </div>

          {/* Balanç de Potència (Generació vs Demanda) */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono font-bold">
            <span className="text-amber-600 dark:text-amber-400" title="Generació activa">
              ⚡ {telemetry.totalGenerationMW} MW
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-sky-600 dark:text-sky-400" title="Demanda consumida">
              🏙️ {telemetry.totalDemandMW} MW
            </span>
          </div>

          {/* Sol i Vent */}
          <div className="hidden lg:flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5" title="Radiació solar">
              <Sun className={`w-4 h-4 ${weather.solarIntensity > 0.1 ? 'text-amber-500 animate-spin-slow' : 'text-slate-400'}`} />
              <span>{Math.round(weather.solarIntensity * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5" title="Velocitat del vent">
              <Wind className="w-4 h-4 text-sky-500" />
              <span>{Math.round(weather.windSpeed)} km/h</span>
            </div>
          </div>
        </div>

        {/* SECCIÓ DRETA: MIX ELÈCTRIC, CO2, PRESSUPOST I BATERIES */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Indicador del Mix Elèctric */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-bold"
            title="Mix Elèctric: Sempre visible a la dreta sota el mercat"
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Mix:</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
              {telemetry.renewablePercentage}% Net
            </span>
          </div>

          {/* Píndola de CO2 */}
          <div className="flex items-center gap-1.5" title={`Emissions de CO₂: ${co2Pct}% del límit permissible.`}>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${co2Badge.style} flex items-center gap-1.5`}>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>CO₂ {co2Pct}%</span>
            </span>
          </div>

          {/* Pressupost (€) + Balanç per segon */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-xs sm:text-sm"
            title="Pressupost disponible i flux econòmic net en temps real (k€/s)"
          >
            <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{Math.round(telemetry.budgetEuros)} k€</span>
            {!isPaused && telemetry.netCashflowPerSec !== undefined && Math.abs(telemetry.netCashflowPerSec) >= 0.1 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  telemetry.netCashflowPerSec >= 0
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                }`}
              >
                {telemetry.netCashflowPerSec > 0 ? `+${telemetry.netCashflowPerSec.toFixed(1)}/s` : `${telemetry.netCashflowPerSec.toFixed(1)}/s`}
              </span>
            )}
          </div>

          {/* Bateries Disponibles */}
          <button
            onClick={() => onSelectTool(selectedTool === 'BATTERY' ? 'MAT' : 'BATTERY')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTool === 'BATTERY'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/15'
            }`}
            title="Eina Bateria BESS (Tecla 4): Clica una Subestació o Ciutat per instal·lar-hi una bateria"
          >
            <Battery className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{batteriesAvailable} BESS</span>
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. AVISOS I ALARMES (CENTRADES AL MIG DEL MAPA SENSE TAPAR CAP COLUMNA)   */}
      {/* ========================================================================= */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-2 px-2 max-w-lg w-full">
        {/* NOTIFICACIÓ D'ALERTA GENERAL, PRESSUPOST O CABLES */}
        {telemetry.lastNotification && (
          <div className={`max-w-md w-full px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md text-xs sm:text-sm pointer-events-auto leading-relaxed font-bold ${
            telemetry.lastNotification.isError
              ? 'bg-rose-600/95 text-white border-rose-300 shadow-rose-500/30'
              : 'bg-emerald-600/95 text-white border-emerald-300 shadow-emerald-500/30'
          }`}>
            <span className="text-xl shrink-0">{telemetry.lastNotification.isError ? '⚠️' : '✅'}</span>
            <div className="flex-1">
              {telemetry.lastNotification.text}
            </div>
          </div>
        )}

        {/* AVÍS DE DÈFICIT ELÈCTRIC A CIUTAT / HOSPITAL */}
        {criticalConsumer && (
          <div className="max-w-md w-full bg-rose-600/95 text-white font-bold px-4 py-3 rounded-2xl shadow-2xl border border-rose-300 flex items-center gap-3 backdrop-blur-md text-xs sm:text-sm pointer-events-auto leading-relaxed">
            <span className="text-xl">🚨</span>
            <div className="flex-1">
              <strong>DÈFICIT A {criticalConsumer.name.toUpperCase()} ({Math.ceil(criticalConsumer.overloadTimer)}s):</strong> No rep prou energia! Connecta una línia de distribució o una bateria BESS abans que s'apagui.
            </div>
          </div>
        )}

        {/* ALERTA DE SOBREFREQÜÈNCIA (>50.40 Hz) */}
        {telemetry.gridFrequency >= 50.40 && (
          <div className="max-w-md w-full bg-rose-600/95 text-white font-bold px-4 py-3 rounded-2xl shadow-2xl border border-rose-300 flex items-center gap-3 backdrop-blur-md text-xs sm:text-sm pointer-events-auto leading-relaxed">
            <span className="text-xl">📈</span>
            <div className="flex-1">
              <strong>SOBREFREQÜÈNCIA CRÍTICA ({telemetry.gridFrequency.toFixed(2)} Hz):</strong> Excés de generació! Redueix potència al panell de gestió de les centrals ({Math.ceil(telemetry.overFreqTimer)}s).
            </div>
          </div>
        )}

        {/* ESDEVENIMENT CLIMÀTIC DINÀMIC */}
        {telemetry.activeEvent && (
          <div className="max-w-md w-full bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex flex-col gap-1.5 backdrop-blur-md text-xs sm:text-sm pointer-events-auto leading-relaxed">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-bold text-amber-400">
                <span className="text-lg">{telemetry.activeEvent.icon}</span>
                <span>{telemetry.activeEvent.title}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold font-mono text-xs">
                {Math.ceil(telemetry.activeEvent.remainingSec)}s
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {telemetry.activeEvent.description}
            </p>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="bg-amber-400 h-full transition-all duration-200"
                style={{ width: `${(telemetry.activeEvent.remainingSec / telemetry.activeEvent.totalSec) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* PROTOCOL D'EMERGÈNCIA PER CO2 */}
        {telemetry.co2AlertLevel === 'EMERGENCY' && (
          <div className="max-w-md w-full bg-red-600/95 text-white font-bold px-4 py-3 rounded-2xl shadow-xl border border-red-300 flex items-center gap-3 backdrop-blur text-xs sm:text-sm pointer-events-auto leading-relaxed">
            <span className="text-xl">🔥</span>
            <div className="flex-1">
              {telemetry.difficulty === 'AULA' ? (
                <span><strong>ALERTA CLIMÀTICA (100% Sostre CO₂):</strong> Penalitzacions per emissions actives (-2 k€/s). Tanca els Cicles Combinats de Gas per salvar el pressupost!</span>
              ) : (
                <span><strong>PROTOCOL DE DESCONTAMINACIÓ ({Math.ceil(telemetry.co2GraceTimer ?? 45)}s):</strong> Tanca el gas abans de l'aturada de la xarxa!</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. COLUMNA DRETA: OBJECTIUS DEL NIVELL, INTERCONNEXIÓ I MIX ELÈCTRIC      */}
      {/* ========================================================================= */}
      <aside className="fixed top-20 right-4 bottom-24 w-84 sm:w-96 max-w-[calc(100vw-2rem)] z-30 flex flex-col gap-3 pointer-events-auto overflow-y-auto pr-1">
        
        {/* OBJECTIUS I MISSIONS DEL NIVELL (Neteja automàtica dels completats) */}
        {telemetry.missions && telemetry.missions.length > 0 && (() => {
          const totalMissions = telemetry.missions.length;
          const completedCount = telemetry.missions.filter(m => m.completed).length;
          const activeMissions = telemetry.missions.filter(m => !m.completed);
          const displayedMissions = showCompletedMissions ? telemetry.missions : activeMissions;

          return (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 pointer-events-auto text-xs w-full flex flex-col">
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Objectius del Nivell</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold font-mono">
                  {completedCount}/{totalMissions} Complets
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  {activeMissions.length > 0
                    ? `${activeMissions.length} pendents d'assolir:`
                    : "Tots els objectius assolits!"}
                </p>
                {completedCount > 0 && (
                  <button
                    onClick={() => setShowCompletedMissions(!showCompletedMissions)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {showCompletedMissions ? "Amagar fets" : `Veure fets (${completedCount})`}
                  </button>
                )}
              </div>

              {/* Si tots estan completats i no estem mostrant la llista sencera */}
              {activeMissions.length === 0 && !showCompletedMissions && (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Nivell completat amb èxit!</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Tots els objectius s'han netejat i Catalunya està preparada per a la següent fase.
                    </div>
                  </div>
                </div>
              )}

              {/* Llista d'objectius àmplia amb scroll vertical */}
              {displayedMissions.length > 0 && (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5">
                  {displayedMissions.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border transition-all w-full overflow-hidden ${
                        m.completed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 font-bold mb-1.5">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="shrink-0 text-base">{m.completed ? '✅' : '🎯'}</span>
                          <span className="break-words leading-snug text-xs sm:text-sm font-bold">{m.title}</span>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 font-mono font-bold whitespace-nowrap">
                          +{m.rewardEuros} k€
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans mb-2 break-words">
                        {m.description}
                      </p>
                      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[11px] text-slate-400 font-normal">Estat:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {m.progressText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* INTERCONNEXIÓ AMB FRANÇA (Activa només si connectada a Santa Llogaia) */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 pointer-events-auto text-xs w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs sm:text-sm">
              <span>🇫🇷</span>
              <span>Interconnexió amb França (MAT)</span>
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
              Spot: {telemetry.marketPriceEurMWh} €/MWh
            </span>
          </div>

          {isFranceConnected ? (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onBuyMarketItem('INTERCONN_EXPORT')}
                  className={`p-2.5 rounded-xl border font-bold text-xs transition-all text-center cursor-pointer ${
                    telemetry.interconnFlowMW < 0
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                      : 'border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                  }`}
                  title="Activa/Atura l'exportació contínua de 300 MW sobrants a França"
                >
                  {telemetry.interconnFlowMW < 0 ? '🟢 Exportant (-300 MW)' : '📤 Exportar 300 MW'}
                </button>
                <button
                  onClick={() => onBuyMarketItem('INTERCONN_IMPORT')}
                  disabled={telemetry.interconnFlowMW <= 0 && telemetry.budgetEuros < 10}
                  className={`p-2.5 rounded-xl border font-bold text-xs transition-all text-center cursor-pointer disabled:opacity-40 ${
                    telemetry.interconnFlowMW > 0
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50'
                      : 'border-rose-500/30 bg-rose-500/15 hover:bg-rose-500/25 text-rose-800 dark:text-rose-300'
                  }`}
                  title="Activa/Atura la importació contínua de 300 MW d'emergència des de França"
                >
                  {telemetry.interconnFlowMW > 0 ? '🔴 Important (+300 MW)' : '📥 Importar 300 MW'}
                </button>
              </div>
              {telemetry.interconnFlowMW !== 0 && (
                <div className="text-[11px] font-mono text-center py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {telemetry.interconnFlowMW < 0
                    ? '⚡ Evacuant 300 MW cap a Baixas (França) • Fes clic per aturar'
                    : '⚡ Rebuda contínua de 300 MW des de Baixas (França) • Fes clic per aturar'}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5 leading-relaxed">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Comerç Bloquejat:</strong> Connecta la línia MAT 400 kV fins a la Subestació de Santa Llogaia / Figueres per obrir el comerç internacional amb França.
              </span>
            </div>
          )}
        </div>

        {/* TARGETA 2: GRÀFICA DE SECTORS DEL MIX ELÈCTRIC EN TEMPS REAL (SEMPRE VISIBLE) */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 pointer-events-auto text-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>Mix Elèctric en Temps Real</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
              {telemetry.renewablePercentage}% Net
            </span>
          </div>

          <MixDonutChart
            breakdown={telemetry.generationBreakdown}
            totalMW={telemetry.totalGenerationMW}
          />
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 6. CONSOLA HORITZONTAL INFERIOR DE GENERACIÓ + BARRA D'EINES              */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-3 inset-x-0 mx-auto max-w-5xl px-3 z-40 pointer-events-none flex flex-col items-center gap-2 select-none">
        
        {/* BÀNER DE MODE DISSENY QUAN ESTÀ EN PAUSA */}
        {isPaused && (
          <div className="bg-amber-500/95 text-slate-950 font-bold px-5 py-2 rounded-full shadow-2xl border border-amber-300 flex items-center gap-3 backdrop-blur-md text-xs sm:text-sm pointer-events-auto">
            <span className="text-lg">📐</span>
            <span><strong>MODE DISSENY:</strong> Construeix les línies i regula les centrals abans de començar.</span>
            <button
              onClick={onTogglePause}
              className="ml-2 px-3.5 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Començar Simulació (Espai)</span>
            </button>
          </div>
        )}

        {/* BARRA D'EINES (MAT, DISTRIBUCIÓ, TISORES) */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2 pointer-events-auto flex items-center gap-2">
          {/* Línia MAT 400 kV */}
          <button
            onClick={() => onSelectTool('MAT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedTool === 'MAT'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-500/50'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-white" />
            <span>Línia MAT 400 kV</span>
            <span className="text-xs opacity-75 font-mono">({matAvailable} km)</span>
          </button>

          {/* Distribució 25 kV */}
          <button
            onClick={() => onSelectTool('DISTRIBUTION')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedTool === 'DISTRIBUTION'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-500/50'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-sky-500 ring-2 ring-white" />
            <span>Distribució 25 kV</span>
            <span className="text-xs opacity-75 font-mono">({distAvailable} km)</span>
          </button>

          {/* Tisores */}
          <button
            onClick={() => onSelectTool('DELETE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedTool === 'DELETE'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-500/50'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scissors className="w-4 h-4 text-rose-400" />
            <span>Desmuntar</span>
          </button>

          {/* Bateria BESS (Tecla 4) */}
          <button
            onClick={() => onSelectTool('BATTERY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedTool === 'BATTERY'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/50'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Instal·lar Bateria BESS a Subestació o Ciutat (Tecla 4)"
          >
            <Battery className="w-4 h-4 text-emerald-400" />
            <span>Bateria BESS</span>
            <span className="text-xs opacity-75 font-mono">({batteriesAvailable})</span>
          </button>
        </div>

      </footer>
    </>
  );
};
