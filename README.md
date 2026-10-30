# ⚡ Catalunya Smart Grid - Simulador de la Xarxa Elèctrica

Simulador interactiu i educatiu de la xarxa elèctrica de Catalunya per a estudiants de **Tecnologia de Secundària (ESO)**, basat en l'estètica minimalista i mecàniques de traçat de línies de **Mini Metro** (prenent com a referència arquitectònica `Kaos599/mini-metro-js` en TypeScript, React i HTML5 Canvas a 60 FPS).

---

## 🎯 Objectius Pedagògics i Físics

1. **La Llei de Joule i el transport d'energia ($P = I^2 \cdot R$):**
   - Comprendre per què necessitem línies de **Molt Alta Tensió (MAT 400 kV)** per a llargues distàncies: augmentar la tensió redueix la intensitat ($I$), minimitzant les pèrdues per dissipació de calor.
   - Les línies de **Distribució (25 kV)** que abasteixen ciutats pateixen pèrdues per Efecte Joule si el cable és massa llarg (visualitzat mitjançant espurnes de calor) i poden patir sobrecàrrega tèrmica si se sobrepassa $I_{max}$, disparant el magnetotèrmic durant 5 segons.

2. **El paper indispensable de les Subestacions Transformadores:**
   - Una línia MAT no pot connectar directament una central a una ciutat o indústria; cal una **Subestació Transformadora** com a nus de conversió entre alta i mitjana tensió.

3. **El Cicle Dia/Nit i la corba de demanda (Corba de l'Ànec / Duck Curve):**
   - La generació solar fotovoltaica només produeix de dia (8:00 a 19:00, amb màxim a les 13:00).
   - Les llars catalanes tenen el seu pic màxim de consum al vespre (19:00 a 22:00), just quan el sol s'ha post.
   - L'alumnat ha d'equilibrar la xarxa utilitzant centrals **hidroelèctriques reversibles (bombeig al Pirineu)**, **bateries de liti** o accionant puntualment el **cicle combinat de gas**.

4. **Estabilitat de Freqüència (50.0 Hz) i Emergència Climàtica:**
   - La freqüència s'allunya de 50.0 Hz quan hi ha desequilibri entre generació i demanda.
   - **Condicions de fi de partida:**
     - **Apagada General (Blackout):** Una ciutat acumula 8 paquets de demanda sense atendre durant més de 15 segons (7,5 s en hospitals/aeroports).
     - **Emergència Climàtica:** L'excés d'ús de les centrals de gas supera el límit permès de tones de $\text{CO}_2$.

---

## 🗺️ Geografia i Nodos Reals de Catalunya

- **Silueta vectorial minimalista de Catalunya** amb transició suau de colors dia/nit.
- **Barreres geogràfiques naturals:**
  - Riu **Ebre**, riu **Segre & Cinca**, riu **Llobregat** i riu **Ter**.
  - Serralada dels **Pirineus**.
  - Creuar qualsevol riu o la carena muntanyosa consumeix **Torres d'Alta Tensió / Soterraments**.
- **Generadors:**
  - 🟣 **Nuclear (Ascó / Vandellòs):** Hexàgon lila. Generació de base constant 24h, 0 $\text{CO}_2$. No regulable.
  - 🟡 **Solar Fotovoltaica (Ponent / Lleida):** Cercle groc. Genera entre 08:00 i 19:00 segons radiació solar.
  - 🔵 **Eòlica (Terra Alta / Empordà):** Triangle blau amb aspes giratòries segons velocitat del vent.
  - 🔷 **Hidroelèctrica Reversible (Pallars / Susqueda):** Rombe cian. Bomba aigua amb excessos i turbina en dèficit.
  - 🟧 **Cicle Combinat de Gas (Besòs / Tarragona):** Quadrat taronja amb **interruptor interactiu ON/OFF al clic**. Genera a demanda però suma $\text{CO}_2$.
- **Consumidors:**
  - 🟢 **Residencial (Barcelona, Lleida, Girona, Reus):** Doble cercle. Pics matinals i nocturns.
  - 🟦 **Industrial (Petroquímic de Tarragona, Vallès):** Engranatge. Demanda alta i continuada 24h.
  - 🔴 **Infraestructura Crítica (Hospital Vall d'Hebron, Aeroport del Prat):** Creu vermella amb meitat de temps de tolerància a fallades.
- **Nusos de Xarxa:**
  - ⬜ **Subestacions Transformadores (Rubí - Can Jardí, Mangraners, Vic, etc.):** Enllacen línies MAT amb línies de Distribució.

---

## 🎁 Millores Tecnològiques dels Diumenges (Final de Setmana)

Cada 7 dies superats el joc es pausa i l'estudiant tria 1 millora entre:
1. **+1 Línia MAT (400 kV) + Subestació Transformadora**
2. **Bateria de Liti Grid-Scale** per emmagatzemar excedents solars
3. **Cablejat Reforçat (Secció doble):** Duplica la capacitat màxima de corrent ($I_{max}$)
4. **+2 Torres d'Alta Tensió / Soterraments** per creuar rius o muntanyes
5. **Smart Metering:** Redueix un 30% el pic de demanda nocturn d'una ciutat

---

## 🚀 Instal·lació i Execució

```bash
# 1. Instal·lar dependències
npm install

# 2. Executar el servidor de desenvolupament
npm run dev

# 3. Compilar per a producció (GitHub Pages o hosting estàtic)
npm run build
```

---

## 🕹️ Controls

- **Clic i arrossegar des d'un node:** Traça un cable elèctric de la tensió seleccionada.
- **Selector de tensió (Barra inferior):** Tria entre MAT 400 kV (Rojo/Taronja) o Distribució 25 kV (Blau).
- **Clic sobre la Central de Gas (Quadrat taronja):** Alterna l'estat ON/OFF del cicle combinat.
- **Botó dret sobre un cable:** Desmunta la línia i recupera els materials a l'inventari.
- **Botons de velocitat:** Pausa, 1x i 2x.
- **Selector CA / ES:** Canvi ràpid d'idioma en temps real.
- **Icona d'interrogant (?):** Obre la guia interactiva de física elèctrica.
