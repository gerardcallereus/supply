import React, { useMemo } from 'react';
import { UpgradeType, Language } from '../types';
import { I18N_TEXTS } from '../i18n';
import { Zap, Battery, ShieldCheck, Cable, Cpu } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onSelectUpgrade: (type: UpgradeType) => void;
  lang: Language;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onSelectUpgrade,
  lang,
}) => {
  if (!isOpen) return null;

  const t = I18N_TEXTS[lang];

  // Pick 3 random upgrades from available pool
  const options = useMemo(() => {
    const allUpgrades: { type: UpgradeType; icon: React.ReactNode; color: string }[] = [
      {
        type: 'NEW_MAT_LINE',
        icon: <Zap className="w-6 h-6" />,
        color: 'from-orange-500 to-amber-600',
      },
      {
        type: 'BATTERY',
        icon: <Battery className="w-6 h-6" />,
        color: 'from-emerald-500 to-teal-600',
      },
      {
        type: 'REINFORCED_LINE',
        icon: <ShieldCheck className="w-6 h-6" />,
        color: 'from-blue-500 to-indigo-600',
      },
      {
        type: 'NEW_DIST_LINE',
        icon: <Cable className="w-6 h-6" />,
        color: 'from-sky-500 to-blue-600',
      },
      {
        type: 'SMART_METERING',
        icon: <Cpu className="w-6 h-6" />,
        color: 'from-purple-500 to-pink-600',
      },
    ];

    // Shuffle and pick 3
    const shuffled = [...allUpgrades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-center">
        
        {/* Header */}
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-3">
          <Zap className="w-8 h-8 fill-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t.weeklyUpgradeTitle}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm max-w-lg mx-auto mb-6">
          {t.weeklyUpgradeSubtitle}
        </p>

        {/* 3 Upgrade Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {options.map((opt) => {
            const title = t.upgrades[`${opt.type}_title` as keyof typeof t.upgrades];
            const desc = t.upgrades[`${opt.type}_desc` as keyof typeof t.upgrades];

            return (
              <button
                key={opt.type}
                onClick={() => onSelectUpgrade(opt.type)}
                className="flex flex-col items-center text-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 hover:shadow-xl group"
              >
                <div className={`p-4 rounded-2xl bg-gradient-to-tr ${opt.color} text-white shadow-md mb-3 group-hover:scale-110 transition-transform`}>
                  {opt.icon}
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 leading-tight">
                  {title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  {desc}
                </p>
              </button>
            );
          })}
        </div>

        <p className="text-slate-400 text-xs font-mono">
          💡 La tria de tecnologia condicionarà la resistència de la xarxa davant els pics de la setmana vinent.
        </p>
      </div>
    </div>
  );
};
