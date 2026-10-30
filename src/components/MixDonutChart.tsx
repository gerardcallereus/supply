import React from 'react';
import { GenerationBreakdown } from '../types';

interface MixDonutChartProps {
  breakdown?: GenerationBreakdown;
  totalMW: number;
}

export const MixDonutChart: React.FC<MixDonutChartProps> = ({
  breakdown,
  totalMW,
}) => {
  const size = 110;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2; // (110 - 18) / 2 = 46
  const circumference = 2 * Math.PI * radius; // ~289.02

  if (!breakdown || totalMW <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-3 text-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray="6 6"
              className="text-slate-200 dark:text-slate-800"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold font-mono text-slate-400">0 MW</span>
            <span className="text-[10px] text-slate-400 font-sans">En espera</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-sans">
          Engega les centrals a la consola inferior per veure el repartiment energètic.
        </p>
      </div>
    );
  }

  const { nuclearMW, gasMW, hydroMW, solarMW, windMW, biomassMW = 0 } = breakdown;
  const sources = [
    { name: 'Nuclear', icon: '⚛️', mw: nuclearMW, color: '#8B5CF6', clean: true },
    { name: 'Solar', icon: '☀️', mw: solarMW, color: '#EAB308', clean: true },
    { name: 'Eòlica', icon: '💨', mw: windMW, color: '#0284C7', clean: true },
    { name: 'Hidroelèctrica', icon: '💧', mw: hydroMW, color: '#06B6D4', clean: true },
    { name: 'Biomassa', icon: '🪵', mw: biomassMW, color: '#16A34A', clean: true },
    { name: 'Gas C.C. (CO₂)', icon: '🔥', mw: gasMW, color: '#F97316', clean: false },
  ];

  const activeSources = sources.filter(s => s.mw > 0);
  const cleanMW = activeSources.filter(s => s.clean).reduce((acc, s) => acc + s.mw, 0);
  const cleanPct = Math.round((cleanMW / totalMW) * 100);

  let accumulatedLength = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 select-none">
      {/* SVG Donut amb mides explícites en píxels */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
        >
          {/* Fons del donut */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Segments de colors per tecnologia */}
          {activeSources.map((seg) => {
            const ratio = seg.mw / totalMW;
            const segmentDash = ratio * circumference;
            const strokeDasharray = `${segmentDash} ${circumference - segmentDash}`;
            const strokeDashoffset = -accumulatedLength;
            accumulatedLength += segmentDash;

            return (
              <circle
                key={seg.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Text Central clar: si és 0% net, indica 0% Net / Gas C.C. per no confondre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className={`text-base sm:text-lg font-black leading-none font-mono ${
            cleanPct === 100 ? 'text-emerald-500 dark:text-emerald-400' :
            cleanPct === 0 ? 'text-orange-500 dark:text-orange-400' :
            'text-slate-900 dark:text-white'
          }`}>
            {cleanPct}%
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-tight leading-none mt-1 ${
            cleanPct === 100 ? 'text-emerald-600 dark:text-emerald-400' :
            cleanPct === 0 ? 'text-orange-600 dark:text-orange-400' :
            'text-indigo-600 dark:text-indigo-400'
          }`}>
            {cleanPct === 100 ? 'Sense CO₂' : cleanPct === 0 ? 'Fòssil (CO₂)' : 'Renovable'}
          </span>
        </div>
      </div>

      {/* Llegenda detallada amb tecnologia, MW i percentatge */}
      <div className="flex-1 w-full space-y-1.5 font-mono text-xs">
        {activeSources.map((s) => {
          const pct = Math.round((s.mw / totalMW) * 100);
          return (
            <div
              key={s.name}
              className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-xs font-sans">
                  {s.icon} {s.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-right">
                <span className="font-bold text-slate-900 dark:text-slate-100">{s.mw} MW</span>
                <span className="text-slate-400 text-[11px] w-8 text-right">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
