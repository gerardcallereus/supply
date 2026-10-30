import React from 'react';
import { GameOverState, Language } from '../types';
import { I18N_TEXTS } from '../i18n';
import { RotateCcw, AlertOctagon, Flame, Award, Calendar, Zap, Wind, Trophy } from 'lucide-react';

interface GameOverModalProps {
  gameOver: GameOverState;
  onRestart: () => void;
  lang: Language;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameOver,
  onRestart,
  lang,
}) => {
  if (!gameOver.isOver) return null;

  const t = I18N_TEXTS[lang];
  const isVictory = gameOver.reason === 'VICTORY' || gameOver.isVictory;
  const isBlackout = gameOver.reason === 'BLACKOUT';
  const isOverFreq = gameOver.reason === 'OVERFREQUENCY';

  const explanation = isVictory
    ? "Enhorabona! Has aconseguit connectar i sincronitzar tot el territori català: l'eòlica marina flotant del Golf de Roses, la solar de Ponent, el bombament dels Pirineus, la biomassa de la Garrotxa i les bateries BESS. Catalunya compta ara amb una xarxa elèctrica sobirana, 100% neta, intel·ligent i resilient!"
    : isBlackout 
      ? t.blackoutExplanation 
      : isOverFreq 
        ? (t as any).overfrequencyExplanation || "DISPARAMENT PER SOBREFREQÜÈNCIA (> 50.50 Hz): Excés de generació sense bateries ni bombament suficients."
        : t.climateExplanation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl">
        
        {/* Cause Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-3xl ${
            isVictory
              ? 'bg-amber-500/15 text-amber-500'
              : isBlackout 
                ? 'bg-red-500/10 text-red-500' 
                : isOverFreq 
                  ? 'bg-purple-500/10 text-purple-500' 
                  : 'bg-orange-500/10 text-orange-500'
          }`}>
            {isVictory ? (
              <Trophy className="w-12 h-12" />
            ) : isBlackout ? (
              <AlertOctagon className="w-12 h-12" />
            ) : isOverFreq ? (
              <Zap className="w-12 h-12" />
            ) : (
              <Flame className="w-12 h-12" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-1">
          {isVictory ? "🏆 VICTÒRIA HISTÒRICA: CATALUNYA 2030!" : t.gameOverTitle}
        </h2>
        <div className="text-center font-mono font-bold text-sm mb-4">
          <span className={`px-3 py-1 rounded-full ${
            isVictory
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : isBlackout 
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' 
                : isOverFreq 
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400' 
                  : 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400'
          }`}>
            {isVictory
              ? "🌟 PROENCAT 2030 COMPLETAT AMB ÈXIT"
              : isBlackout 
                ? "⚡ APAGADA GENERAL (BLACKOUT)" 
                : isOverFreq 
                  ? "📈 SOBREFREQÜÈNCIA CRÍTICA (>50.5 Hz)" 
                  : "🔥 EMERGÈNCIA CLIMÀTICA (CO₂)"}
          </span>
        </div>

        {/* Educational Physics Feedback */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 mb-5 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            {isVictory ? <Award className="w-3.5 h-3.5 text-amber-500" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
            {isVictory ? "Llegat Energètic Assolit" : t.educationalFeedback}
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
            {explanation}
          </p>
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 font-mono text-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
            <Calendar className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <div className="text-slate-400 text-[10px] uppercase">{t.daysSurvived}</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">
              {gameOver.stats.daysSurvived}
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
            <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <div className="text-slate-400 text-[10px] uppercase">Energia neta</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">
              {gameOver.stats.mwhDelivered} MWh
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
            <Wind className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
            <div className="text-slate-400 text-[10px] uppercase">{t.avgRenewables}</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">
              {gameOver.stats.renewableAvg}%
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
            <Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" />
            <div className="text-slate-400 text-[10px] uppercase">CO₂ emès</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-100">
              {gameOver.stats.co2Emitted} t
            </div>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          {isVictory ? "Jugar de nou" : t.retry}
        </button>
      </div>
    </div>
  );
};
