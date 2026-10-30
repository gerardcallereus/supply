import React from 'react';
import { Language } from '../types';
import { I18N_TEXTS } from '../i18n';
import { X, Zap, Activity, Sun, Battery, AlertTriangle, Layers, Flame } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  const t = I18N_TEXTS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.instructionsTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Conceptes físics clau per a estudiants de Tecnologia (ESO)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left">
          
          {/* 1. Mechanics / Controls */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-2">
              <span>🖱️</span> Com jugar: Traçat de línies (Estil Mini Metro)
            </h3>
            <p>
              Fes clic i arrossega el ratolí des de qualsevol central o subestació cap a una altra per estendre un cable elèctric. Pots triar entre línies de <strong>Molt Alta Tensió (MAT 400 kV)</strong> i de <strong>Distribució (25 kV)</strong> a la barra inferior.
            </p>
          </div>

          {/* 2. Physics: Joule Effect */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              L'Efecte Joule i la Tensió elèctrica: P = I² · R
            </h3>
            <p className="mb-2">
              Quan l'electricitat viatja per un cable, la resistència del metall converteix part de l'energia en calor (pèrdues tèrmiques).
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>
                <strong>MAT 400 kV (Rojo/Taronja):</strong> En pujar la tensió a 400.000 V, la intensitat necessària ($I$) es redueix dràsticament, fent les pèrdues gairebé nul·les en llargues distàncies.
              </li>
              <li>
                <strong>Distribució 25 kV (Blau):</strong> Porta la llum a les ciutats, però si el tram és massa llarg es veuran <strong>espurnes de pèrdua tèrmica</strong>.
              </li>
              <li>
                <strong>Subestacions:</strong> Són l'únic lloc on es pot transformar la tensió de 400 kV a 25 kV. No pots connectar directament una línia MAT a una ciutat sense passar per una subestació!
              </li>
            </ul>
          </div>

          {/* 3. Daily Cycle & Demand Peaks */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              El Cicle Dia/Nit i la Corba de Demanda
            </h3>
            <p>
              Els parcs solars només generen de dia (màxim a les 13:00). Però el gran pic de consum a les ciutats catalanes arriba al vespre (19:00 - 22:00) quan la gent torna a casa i ja no hi ha sol.
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Per cobrir aquest buit, cal usar la <strong>hidroelèctrica reversible</strong> (bombeig al Pirineu), les <strong>bateries de liti</strong> o, en casos extrems, encendre el <strong>cicle combinat de gas</strong> fent clic sobre el seu node (alerta: emet CO₂!).
            </p>
          </div>

          {/* 4. Defeat Conditions */}
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <h3 className="font-bold text-sm text-red-900 dark:text-red-200 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Com evitar el Blackout i l'Emergència Climàtica
            </h3>
            <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-300">
              <li>
                Si una ciutat arriba a 8 paquets de demanda sense cobrir, s'activa un cercle vermell de compte enrere de 15 segons abans de l'<strong>Apagada General</strong>.
              </li>
              <li>
                Si s'abusa del gas fòssil, el comptador de <strong>CO₂</strong> superarà el límit i perdràs la partida per crisi ambiental.
              </li>
              <li>
                Mantingues la freqüència en <strong>50.0 Hz</strong> equilibrant en temps real la generació amb el consum!
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
