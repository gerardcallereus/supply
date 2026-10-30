import React from 'react';
import { LevelInfo, Language } from '../types';
import { ALL_GRID_NODES } from '../utils/catalunyaGeography';
import { Sparkles, ArrowRight, Zap, MapPin } from 'lucide-react';

interface LevelUpModalProps {
  levelInfo: LevelInfo | null;
  onContinue: () => void;
  lang: Language;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  levelInfo,
  onContinue,
  lang,
}) => {
  if (!levelInfo) return null;

  // Retrieve details of new nodes added in this level
  const newNodes = ALL_GRID_NODES.filter(n => levelInfo.nodeIds.includes(n.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-center">
        
        {/* Level badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Nou Nivell Desbloquejat</span>
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {levelInfo.name}
        </h2>

        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
          {levelInfo.description}
        </p>

        {/* List of New Nodes Added */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 text-left max-h-56 overflow-y-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            Nous punts connectables al mapa:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {newNodes.map(node => (
              <div 
                key={node.id} 
                className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs"
              >
                <span className={`w-3 h-3 rounded-full shrink-0 ${
                  node.type === 'GENERATOR' ? 'bg-amber-500' :
                  node.type === 'SUBSTATION' ? 'bg-slate-400 border border-slate-600' : 'bg-emerald-500'
                }`} />
                <div className="truncate">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{node.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{node.comarca}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onContinue}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <span>Connectar la xarxa</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
