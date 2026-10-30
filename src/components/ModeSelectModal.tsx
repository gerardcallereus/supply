import React from 'react';
import { GameDifficulty } from '../types';
import { GraduationCap, ShieldAlert, Zap, Award, CheckCircle2 } from 'lucide-react';

interface ModeSelectModalProps {
  isOpen: boolean;
  onSelectMode: (mode: GameDifficulty) => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  isOpen,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Capçalera */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 mb-3 shadow-sm">
            <Zap className="w-8 h-8 fill-amber-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            Benvingut a Supply
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl mx-auto mt-2 leading-relaxed">
            Abans de començar a operar la xarxa elèctrica de Catalunya, selecciona el teu perfil de simulació. Aquesta tria es mantindrà durant tota la partida per garantir una experiència coherent.
          </p>
        </div>

        {/* Targetes de Selecció */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          
          {/* Opció 1: Mode Aula */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 to-transparent hover:border-indigo-500 transition-all hover:shadow-xl group">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    Recomanat per a Instituts
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Mode Aula
                  </h3>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                Dissenyat específicament per a l'aprenentatge guiat a secundària, batxillerat i cicles formatius de tecnologia i ciències.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Sense Game Over sobtat per CO₂:</strong> Superar les emissions aplica taxes climàtiques contínues sense tallar la partida.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Protecció de Sobrefreqüència:</strong> Relés automàtics desconnecten generació si la freqüència s'acosta al perill.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Temps de reacció ampli:</strong> 35 segons per equilibrar demandes urbanes abans de cap incidència.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectMode('AULA')}
              className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all transform group-hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Selecciona Mode Aula
            </button>
          </div>

          {/* Opció 2: Mode Operador */}
          <div className="flex flex-col justify-between p-6 rounded-2xl border-2 border-rose-500/30 bg-gradient-to-b from-rose-500/5 to-transparent hover:border-rose-500 transition-all hover:shadow-xl group">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                    Repte Professional
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Operador de Xarxa
                  </h3>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                Simulació estricta i realista inspirada en els centres de control del transport elèctric (tipus Red Eléctrica / REE).
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Condicions reals de Blackout:</strong> Una fallada desatesa a un consumidor atura la xarxa elèctrica.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Sensibilitat dels 50.00 Hz:</strong> Desviacions brusques per manca o excés de MW disparen les proteccions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Protocol de Descontaminació:</strong> Només 45 segons per desconnectar cicles combinats si s'excedeix el CO₂.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectMode('OPERADOR')}
              className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition-all transform group-hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              Selecciona Operador de Xarxa
            </button>
          </div>

        </div>

        {/* Peu informatiu per a dislèxia i accessibilitat */}
        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3.5 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          💡 La simulació començarà en <strong>Mode Disseny (Pausa)</strong> amb les centrals apagades a 0 MW, de manera que puguis traçar les primeres línies MAT i Distribució abans d'iniciar el flux d'electrons.
        </div>

      </div>
    </div>
  );
};
