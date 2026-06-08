"use client";

import { useState, useEffect } from "react";

// --- INTERFACCE STRUTTURA DATI ---
interface Macro { kcal: number; prot: number; carbo: number; fat: number; }
interface FoodLog { id: string; time: string; rawText: string; macros: Macro; }
interface WorkoutLog { id: string; time: string; rawText: string; summary: string; }

interface WeightLog { id: string; weight: number; date: string; }
interface DailyLog { food: FoodLog[]; workouts: WorkoutLog[]; weightAtDate?: number; }
interface HistoryDatabase { [dateStr: string]: DailyLog; }

interface UserProfile {
  name: string;
  email: string;
  weightInitial: number;
  weightTarget: number;
  height: number;
  age: number;
  gender: string;
  kcalTarget: number;
  protTarget: number;
  carboTarget: number;
  fatTarget: number;
  timelineMonths: number;
  workoutFrequency: number;
  intensity: string;
  activityType: string;
  createdAt: string;
}

interface PopupFeedback { visible: boolean; title: string; macros?: Macro; }

export default function Home() {
  // --- NAVIGAZIONE ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "tracker" | "calendario" | "grafici">("dashboard");
  const [todayStr, setTodayStr] = useState("");

  // --- STATI AUTH E ONBOARDING ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const [nameIn, setNameIn] = useState("");
  const [emailIn, setEmailIn] = useState("");

  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isEditingActivity, setIsEditingActivity] = useState(false);

  // Dati Onboarding base
  const [heightIn, setHeightIn] = useState<number>(178);
  const [weightIn, setWeightIn] = useState<number>(66.5);
  const [ageIn, setAgeIn] = useState<number>(16);
  const [weightTargetIn, setWeightTargetIn] = useState<number>(80);

  const [workoutFrequencyIn, setWorkoutFrequencyIn] = useState<number>(4);
  const [intensityIn, setIntensityIn] = useState<string>("Media");
  const [activityTypeIn, setActivityTypeIn] = useState<string>("Pesi");

  const [timelineMonthsIn, setTimelineMonthsIn] = useState<number>(3);

  // --- STATI TRACKING ---
  const [db, setDb] = useState<HistoryDatabase>({});
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foodInput, setFoodInput] = useState("");
  const [loadingFood, setLoadingFood] = useState(false);

  const [popup, setPopup] = useState<PopupFeedback>({ visible: false, title: "" });
  const [expandedDates, setExpandedDates] = useState<{ [key: string]: boolean }>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [coachPhrase, setCoachPhrase] = useState("");

  // ==========================================
  // BOOTSTRAP ENGINE
  // ==========================================
  useEffect(() => {
    const oggi = new Date().toISOString().split("T")[0];
    setTodayStr(oggi);

    const savedUser = localStorage.getItem("snapfit_user");
    let initialWeightFromUser = 75;

    if (savedUser) {
      const currentUser = JSON.parse(savedUser);
      if (currentUser) {
        setUser(currentUser);
        initialWeightFromUser = currentUser.weightInitial ?? 75;
        setWorkoutFrequencyIn(currentUser.workoutFrequency ?? 4);
        setIntensityIn(currentUser.intensity ?? "Media");
        setActivityTypeIn(currentUser.activityType ?? "Pesi");
      }
    }

    const savedDB = localStorage.getItem("snapfit_db");
    if (savedDB) setDb(JSON.parse(savedDB));

    let savedWeights = localStorage.getItem("snapfit_weight_logs");
    let parsedWeights: WeightLog[] = savedWeights ? JSON.parse(savedWeights) : [];

    if (parsedWeights.length === 0) {
      const d1 = new Date(); d1.setDate(d1.getDate() - 14);
      const d2 = new Date(); d2.setDate(d2.getDate() - 7);

      parsedWeights = [
        { id: "w1", weight: initialWeightFromUser, date: d1.toISOString().split("T")[0] },
        { id: "w2", weight: initialWeightFromUser + 2.5, date: d2.toISOString().split("T")[0] },
        { id: "w3", weight: initialWeightFromUser + 5.0, date: oggi }
      ].sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem("snapfit_weight_logs", JSON.stringify(parsedWeights));
    }
    setWeightLogs(parsedWeights);
  }, []);

  const saveDatabase = (updatedDB: HistoryDatabase) => {
    setDb(updatedDB);
    localStorage.setItem("snapfit_db", JSON.stringify(updatedDB));
  };

  const saveWeightLogs = (updatedWeights: WeightLog[]) => {
    setWeightLogs(updatedWeights);
    localStorage.setItem("snapfit_weight_logs", JSON.stringify(updatedWeights));
  };

  const triggerPopup = (title: string, macros?: Macro) => {
    setPopup({ visible: true, title, macros });
    setTimeout(() => setPopup({ visible: false, title: "" }), 4000);
  };

  const toggleDateExpansion = (dateStr: string) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setOnboardingStep(0);
    setAuthMode("login");
    triggerPopup("🔒 Profilo Disconnesso");
  };

  const calculateTDEEMultiplier = (freq: number, intens: string, type: string) => {
    let multiplier = 1.2;
    if (freq >= 1 && freq <= 2) {
      multiplier = intens === "Alta" ? 1.45 : intens === "Media" ? 1.375 : 1.3;
    } else if (freq >= 3 && freq <= 4) {
      multiplier = intens === "Alta" ? 1.65 : intens === "Media" ? 1.55 : 1.45;
    } else if (freq >= 5) {
      multiplier = intens === "Alta" ? 1.9 : intens === "Media" ? 1.725 : 1.6;
    }
    if (type === "CrossFit" || type === "Corsa/Cardio") multiplier += 0.05;
    return multiplier;
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "register") setOnboardingStep(1);
    else {
      const mockProfile: UserProfile = {
        name: "Atleta", email: emailIn,
        weightInitial: 75.0, weightTarget: 80.0,
        height: 178, age: 16, gender: "M",
        kcalTarget: 3100, protTarget: 175, carboTarget: 560, fatTarget: 72,
        timelineMonths: 3, workoutFrequency: 4, intensity: "Media", activityType: "Pesi",
        createdAt: new Date().toISOString().split("T")[0]
      };
      setUser(mockProfile);
      localStorage.setItem("snapfit_user", JSON.stringify(mockProfile));
    }
  };

  const handleProcessCalculations = () => {
    setErrorMessage("");
    const weightDelta = weightTargetIn - weightIn;
    const weeksToTarget = timelineMonthsIn * 4.33;
    const kgPerWeek = weightDelta / weeksToTarget;

    const maxSafeKgPerWeek = weightIn * 0.01;
    if (Math.abs(kgPerWeek) > maxSafeKgPerWeek) {
      const suggestedWeeks = Math.ceil(Math.abs(weightDelta) / maxSafeKgPerWeek);
      setErrorMessage(`⚠️ Obiettivo troppo aggressivo. Tempo consigliato: ${suggestedWeeks}-${suggestedWeeks + 4} settimane.`);
      return;
    }

    const bmr = (10 * weightIn) + (6.25 * heightIn) - (5 * ageIn) + 5;
    const activityMultiplier = calculateTDEEMultiplier(workoutFrequencyIn, intensityIn, activityTypeIn);
    const tdee = bmr * activityMultiplier;

    const dailyCalorieDiff = (kgPerWeek * 7700) / 7;
    const finalKcal = Math.round(tdee + dailyCalorieDiff);

    const finalProt = Math.round(weightIn * 2.2);
    const finalFat = Math.round(weightIn * 0.9);
    const remainingCalories = finalKcal - (finalProt * 4) - (finalFat * 9);
    const finalCarbs = Math.max(0, Math.round(remainingCalories / 4));

    const profile: UserProfile = {
      name: nameIn || "Atleta", email: emailIn,
      weightInitial: weightIn, weightTarget: weightTargetIn,
      height: heightIn, age: ageIn, gender: "M",
      kcalTarget: finalKcal, protTarget: finalProt, carboTarget: finalCarbs, fatTarget: finalFat,
      timelineMonths: timelineMonthsIn,
      workoutFrequency: workoutFrequencyIn, intensity: intensityIn, activityType: activityTypeIn,
      createdAt: todayStr
    };

    setUser(profile);
    localStorage.setItem("snapfit_user", JSON.stringify(profile));
    saveWeightLogs([{ id: crypto.randomUUID(), weight: weightIn, date: profile.createdAt }]);
    setOnboardingStep(7);
  };

  const currentWeight = weightLogs.find(l => l.date === todayStr)?.weight || weightLogs[weightLogs.length - 1]?.weight || (user ? user.weightInitial : 75);

  const handleUpdateActivityFromSettings = () => {
    if (!user) return;

    const targetW = Number(user.weightTarget);
    const currentW = Number(currentWeight);
    const bmr = (10 * currentW) + (6.25 * Number(user.height)) - (5 * Number(user.age)) + 5;
    const activityMultiplier = calculateTDEEMultiplier(workoutFrequencyIn, intensityIn, activityTypeIn);
    const tdee = bmr * activityMultiplier;

    const totalWeightDelta = targetW - currentW;
    const weeksRemaining = Math.max(2, (Number(user.timelineMonths) * 4.33));
    const kgPerWeek = totalWeightDelta / weeksRemaining;

    const dailyCalorieDiff = (kgPerWeek * 7700) / 7;
    const finalKcal = Math.round(tdee + dailyCalorieDiff);

    const finalProt = Math.round(currentW * 2.2);
    const finalFat = Math.round(currentW * 0.9);
    const remainingCalories = finalKcal - (finalProt * 4) - (finalFat * 9);
    const finalCarbs = Math.max(0, Math.round(remainingCalories / 4));

    const updatedProfile: UserProfile = {
      ...user,
      kcalTarget: isNaN(finalKcal) ? user.kcalTarget : finalKcal,
      protTarget: isNaN(finalProt) ? user.protTarget : finalProt,
      carboTarget: isNaN(finalCarbs) ? user.carboTarget : finalCarbs,
      fatTarget: isNaN(finalFat) ? user.fatTarget : finalFat,
      workoutFrequency: workoutFrequencyIn,
      intensity: intensityIn,
      activityType: activityTypeIn
    };

    setUser(updatedProfile);
    localStorage.setItem("snapfit_user", JSON.stringify(updatedProfile));
    setIsEditingActivity(false);
    triggerPopup("⚡ TDEE e Macro Ricalcolati!");
  };

  const handleTrackFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput.trim()) return;
    setLoadingFood(true);
    try {
      const text = foodInput.toLowerCase();
      let guessedKcal = 160; let guessedProt = 15; let guessedCarbo = 15; let guessedFat = 2;

      if (text.includes("pollo") || text.includes("tacchino") || text.includes("carne")) {
        guessedKcal = 220; guessedProt = 32; guessedCarbo = 0; guessedFat = 4;
      } else if (text.includes("riso") || text.includes("pasta") || text.includes("avena")) {
        guessedKcal = 360; guessedProt = 8; guessedCarbo = 78; guessedFat = 1;
      } else if (text.includes("uova") || text.includes("uovo")) {
        guessedKcal = 145; guessedProt = 13; guessedCarbo = 1; guessedFat = 10;
      } else if (text.includes("tonno") || text.includes("pesce")) {
        guessedKcal = 130; guessedProt = 27; guessedCarbo = 0; guessedFat = 2;
      } else if (text.includes("shake") || text.includes("whey") || text.includes("proteine")) {
        guessedKcal = 115; guessedProt = 25; guessedCarbo = 2; guessedFat = 1;
      }

      const match = text.match(/(\d+)\s*g/);
      if (match && match[1]) {
        const grams = parseFloat(match[1]); const factor = grams / 100;
        guessedKcal = Math.round(guessedKcal * factor); guessedProt = Math.round(guessedProt * factor);
        guessedCarbo = Math.round(guessedCarbo * factor); guessedFat = Math.round(guessedFat * factor);
      }

      const data: Macro = { kcal: guessedKcal, prot: guessedProt, carbo: guessedCarbo, fat: guessedFat };
      const now = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      const newFoodLog: FoodLog = { id: crypto.randomUUID(), time: now, rawText: foodInput, macros: data };

      const updatedDB = { ...db };
      if (!updatedDB[todayStr]) updatedDB[todayStr] = { food: [], workouts: [] };
      updatedDB[todayStr].food = [newFoodLog, ...updatedDB[todayStr].food];

      saveDatabase(updatedDB);
      setFoodInput("");
      triggerPopup("✅ Alimento Registrato", data);
    } catch (err) {
      triggerPopup("❌ Errore");
    } finally { setLoadingFood(false); }
  };

  const getUserInputTargetDate = () => {
    if (!user) return "";
    const start = user.createdAt ? new Date(user.createdAt) : new Date();
    start.setMonth(start.getMonth() + Number(user.timelineMonths));
    return start.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  };

  const todayRecord = db[todayStr] || { food: [], workouts: [] };
  const todayTotals = todayRecord.food.reduce((acc, item) => ({
    kcal: acc.kcal + item.macros.kcal, prot: acc.prot + item.macros.prot,
    carbo: acc.carbo + item.macros.carbo, fat: acc.fat + item.macros.fat,
  }), { kcal: 0, prot: 0, carbo: 0, fat: 0 });

  const currentStreak = (() => {
    let streak = 0; let checkDate = new Date();
    while (true) {
      const dateString = checkDate.toISOString().split("T")[0];
      const log = db[dateString];
      if (log && log.food && log.food.length > 0) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else { if (streak === 0 && dateString === todayStr) { checkDate.setDate(checkDate.getDate() - 1); continue; } break; }
    }
    return streak;
  })();

  const completionPercentage = user ? Math.min(100, Math.round((todayTotals.kcal / user.kcalTarget) * 100)) : 0;
  const pathCompletionPercentage = user ? (() => {
    const totalDelta = user.weightTarget - user.weightInitial;
    if (totalDelta === 0) return 100;
    return Math.min(100, Math.max(0, Math.round(((currentWeight - user.weightInitial) / totalDelta) * 100)));
  })() : 0;

  const getPredictionEngine = () => {
    if (!user || weightLogs.length < 2) return { status: "wait", msg: "Calibrazione...", milestones: [], speed: 0 };
    const primo = weightLogs[0]; const ultimo = weightLogs[weightLogs.length - 1];
    const giorni = Math.max(1, (new Date(ultimo.date).getTime() - new Date(primo.date).getTime()) / 86400000);
    const velocitySettimana = ((ultimo.weight - primo.weight) / giorni) * 7;
    return { status: "active", speed: velocitySettimana };
  };
  const prediction = getPredictionEngine();

  useEffect(() => {
    if (!user) return;
    const motivazioni = [
      "🔥 Costanza ferrea. Stai mettendo i mattoni d'acciaio per i prossimi mesi. Chiudi ogni singolo grammo oggi.",
      "🥩 Ghisa e precisione. Le fibre muscolari crescono a tavola, non solo sui rack. Aggredisci quel target di proteine.",
      "⚡ Niente scuse da dilettante. Monitorare i macro separa chi vuole cambiare da chi fa solo finta. Spingi!",
      "🧠 Mentalità da atleta. Ogni alimento registrato è precisione ingegneristica applicata alla tua massa."
    ];
    if (todayTotals.prot < user.protTarget && todayTotals.prot > 0) {
      setCoachPhrase(`🚨 Allarme Catabolismo! Sei a quota ${todayTotals.prot}g. Ti mancano ancora ${user.protTarget - todayTotals.prot}g di pro per attivare l'ipertrofia cellulare di oggi! Mandane giù adesso.`);
    } else {
      setCoachPhrase(motivazioni[Math.floor(Math.random() * motivazioni.length)]);
    }
  }, [todayTotals.prot, user, activeTab]);

  let pointsStr = "", fillPath = "", isGraphReady = false;
  let graphCoords: {x: number, y: number, weight: number, date: string}[] = [];
  let targetCoord = { x: 92, y: 10, date: getUserInputTargetDate(), weight: user?.weightTarget || 80 };

  if (user && weightLogs.length > 0) {
    isGraphReady = true;
    const weightsArray = weightLogs.map(l => l.weight);
    const maxW = Math.max(...weightsArray, user.weightTarget, user.weightInitial);
    const minW = Math.min(...weightsArray, user.weightTarget, user.weightInitial);

    const padding = 2;
    const finalMin = minW - padding;
    const den = Math.max(1, (maxW + padding) - finalMin);

    graphCoords = weightLogs.map((log, idx) => {
      const segment = weightLogs.length > 1 ? 55 / (weightLogs.length - 1) : 55;
      return {
        x: 15 + (idx * segment),
        y: 32 - ((log.weight - finalMin) / den) * 24,
        weight: log.weight,
        date: new Date(log.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
      };
    });

    targetCoord.y = 32 - ((user.weightTarget - finalMin) / den) * 24;

    if (graphCoords.length > 0) {
      pointsStr = `M ${graphCoords[0].x} ${graphCoords[0].y}`;
      for (let i = 0; i < graphCoords.length - 1; i++) {
        pointsStr += ` C ${graphCoords[i].x + (graphCoords[i+1].x - graphCoords[i].x)/2} ${graphCoords[i].y}, ${graphCoords[i].x + (graphCoords[i+1].x - graphCoords[i].x)/2} ${graphCoords[i+1].y}, ${graphCoords[i+1].x} ${graphCoords[i+1].y}`;
      }
      fillPath = `${pointsStr} L ${graphCoords[graphCoords.length-1].x} 35 L ${graphCoords[0].x} 35 Z`;
    }
  }

  if (!user) {
    if (onboardingStep >= 1 && onboardingStep <= 6) {
      return (
          <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${(onboardingStep / 6) * 100}%` }}></div>
              </div>

              {onboardingStep === 1 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-zinc-300 text-center">Quanto sei alto? (cm)</label>
                    <input type="number" value={heightIn} onChange={(e) => setHeightIn(Number(e.target.value))} className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-center font-mono text-xl focus:outline-none" />
                    <button onClick={() => setOnboardingStep(2)} className="w-full bg-zinc-100 text-black font-black text-xs py-4 rounded-xl uppercase">Avanti</button>
                  </div>
              )}

              {onboardingStep === 2 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-zinc-300 text-center">Quanti anni hai?</label>
                    <input type="number" value={ageIn} onChange={(e) => setAgeIn(Number(e.target.value))} className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-center font-mono text-xl focus:outline-none" />
                    <button onClick={() => setOnboardingStep(3)} className="w-full bg-zinc-100 text-black font-black text-xs py-4 rounded-xl uppercase">Avanti</button>
                  </div>
              )}

              {onboardingStep === 3 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-zinc-300 text-center">Qual è il tuo peso attuale? (kg)</label>
                    <input type="number" step="0.1" value={weightIn} onChange={(e) => setWeightIn(Number(e.target.value))} className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-center font-mono text-xl focus:outline-none" />
                    <button onClick={() => setOnboardingStep(4)} className="w-full bg-zinc-100 text-black font-black text-xs py-4 rounded-xl uppercase">Avanti</button>
                  </div>
              )}

              {onboardingStep === 4 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-zinc-300 text-center">A che peso vuoi arrivare? (kg)</label>
                    <input type="number" step="0.1" value={weightTargetIn} onChange={(e) => setWeightTargetIn(Number(e.target.value))} className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-center font-mono text-xl focus:outline-none" />
                    <button onClick={() => setOnboardingStep(5)} className="w-full bg-zinc-100 text-black font-black text-xs py-4 rounded-xl uppercase">Avanti</button>
                  </div>
              )}

              {onboardingStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">Quante volte ti alleni a settimana?</label>
                      <select value={workoutFrequencyIn} onChange={(e) => setWorkoutFrequencyIn(Number(e.target.value))} className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none">
                        {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n === 7 ? "7+ volte" : `${n} volte`}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">Intensità media allenamenti</label>
                      <select value={intensityIn} onChange={(e) => setIntensityIn(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none">
                        {["Bassa", "Media", "Alta"].map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">Tipo attività principale</label>
                      <select value={activityTypeIn} onChange={(e) => setActivityTypeIn(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none">
                        {["Pesi", "Calisthenics", "CrossFit", "Corsa/Cardio", "Sport misti"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setOnboardingStep(6)} className="w-full bg-zinc-100 text-black font-black text-xs py-4 rounded-xl uppercase">Avanti</button>
                  </div>
              )}

              {onboardingStep === 6 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-zinc-300 text-center">🎯 In quanto tempo vuoi raggiungere l'obiettivo?</label>
                    <select value={timelineMonthsIn} onChange={(e) => setTimelineMonthsIn(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none">
                      <option value={1}>1 mese (Molto aggressivo)</option>
                      <option value={2}>2 mesi (Aggressivo)</option>
                      <option value={3}>3 mesi (Normale)</option>
                      <option value={6}>6 mesi (Conservativo)</option>
                    </select>
                    {errorMessage && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">{errorMessage}</div>}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setOnboardingStep(5)} className="w-full bg-zinc-800 text-zinc-400 font-bold text-xs py-4 rounded-xl uppercase">Indietro</button>
                      <button onClick={handleProcessCalculations} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-xs py-4 rounded-xl uppercase">Genera Piano 🪄</button>
                    </div>
                  </div>
              )}
            </div>
          </main>
      );
    }

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent uppercase">SNAPFIT AI</h1>
              <p className="text-xs text-zinc-500 font-medium">Predictive Body Architect</p>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase pl-1">Nome</label>
                    <input type="text" value={nameIn} onChange={(e) => setNameIn(e.target.value)} required className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm focus:outline-none" />
                  </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase pl-1">Email</label>
                <input type="email" value={emailIn} onChange={(e) => setEmailIn(e.target.value)} required className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs py-4 rounded-xl uppercase tracking-wider mt-4">
                {authMode === "register" ? "Inizia Configurazione" : "Accedi al Sistema"}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === "register" ? "login" : "register")} className="text-xs text-zinc-500 block mx-auto hover:text-white transition-colors">
              {authMode === "register" ? "Hai già un account? Login" : "Nuovo utente? Registrati"}
            </button>
          </div>
        </main>
    );
  }

  if (onboardingStep === 7) {
    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-zinc-900/60 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-6">
            <div className="text-4xl">🎯</div>
            <h2 className="text-xl font-black text-white uppercase">Piano Creato con Successo</h2>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5"><span className="text-zinc-500 block text-[10px]">Attuale</span><strong>{user.weightInitial} kg</strong></div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5"><span className="text-zinc-500 block text-[10px]">Obiettivo</span><strong>{user.weightTarget} kg</strong></div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5"><span className="text-zinc-500 block text-[10px]">Tempo</span><strong>{Math.round(user.timelineMonths * 4.33)} sett.</strong></div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Fabbisogno Consigliato</span>
              <div className="text-2xl font-mono font-black text-emerald-400 mt-1">{user.kcalTarget} kcal</div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] font-mono">
                <div>🥩 Pro<br/><strong className="text-white text-sm">{user.protTarget}g</strong></div>
                <div>🍚 Carbo<br/><strong className="text-white text-sm">{user.carboTarget}g</strong></div>
                <div>🥑 Grassi<br/><strong className="text-white text-sm">{user.fatTarget}g</strong></div>
              </div>
            </div>
            <button onClick={() => { setOnboardingStep(0); setActiveTab("dashboard"); }} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-xs py-4 rounded-xl uppercase">Inizia il percorso</button>
          </div>
        </main>
    );
  }

  return (
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center p-4 pb-28 font-sans relative overflow-x-hidden">
        {popup.visible && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-xl z-50 flex flex-col items-center">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-wide">{popup.title}</p>
              {popup.macros && <p className="text-[10px] text-zinc-400 mt-1 font-mono">{popup.macros.kcal} kcal • P:{popup.macros.prot}g | C:{popup.macros.carbo}g | F:{popup.macros.fat}g</p>}
            </div>
        )}

        <div className="w-full max-w-md flex justify-between items-center mb-6 px-1 mt-2">
          <div>
            <h1 className="text-sm font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-widest uppercase">SNAPFIT AI</h1>
            <p className="text-[10px] text-zinc-500 font-medium">Operativo: {user.name}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <span className="text-[10px]">🔥</span>
              <span className="text-xs font-mono font-black">{currentStreak}</span>
            </div>
            <button onClick={handleLogout} className="text-[10px] font-black text-zinc-500 border border-white/10 rounded-xl px-2.5 py-1 bg-zinc-900/40 hover:text-red-400 transition-all uppercase">Logout ⎋</button>
          </div>
        </div>

        <div className="w-full max-w-md space-y-4">

          {/* --- TAB 1: HUB DASHBOARD --- */}
          {activeTab === "dashboard" && (
              <div className="space-y-4">

                {/* CARD DESTINAZIONE */}
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">🎯</span>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">DESTINAZIONE</h3>
                  </div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-black font-mono text-white">{currentWeight}kg</span>
                    <span className="text-zinc-600 text-xl">→</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">{user.weightTarget}kg</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-zinc-400 font-medium">
                    <div>Traguardo Stimato: <span className="text-cyan-400 font-mono font-bold">{getUserInputTargetDate()}</span></div>
                    <div className="text-right">Ritmo: <span className="text-emerald-400 font-mono">+{prediction.speed.toFixed(2)} kg/sett</span></div>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase">
                      <span>Avanzamento Programma</span>
                      <span>{pathCompletionPercentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" style={{ width: `${pathCompletionPercentage}%` }} />
                    </div>
                  </div>
                </div>

                {/* CARD ATTIVITÀ SETTIMANALE */}
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400">⚡</span>
                      <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">ATTIVITÀ SETTIMANALE</h3>
                    </div>
                    {!isEditingActivity && (
                        <button onClick={() => setIsEditingActivity(true)} className="text-[10px] font-black text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-lg bg-cyan-500/5">
                          ✏️ Modifica
                        </button>
                    )}
                  </div>

                  {isEditingActivity ? (
                      <div className="space-y-3 p-2 bg-black/30 rounded-xl border border-white/5 text-xs">
                        <div className="flex justify-between items-center">
                          <span>Allenamenti:</span>
                          <select value={workoutFrequencyIn} onChange={(e) => setWorkoutFrequencyIn(Number(e.target.value))} className="bg-[#111113] border border-white/10 rounded px-2 py-1 text-white">
                            {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} volte</option>)}
                          </select>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Intensità:</span>
                          <select value={intensityIn} onChange={(e) => setIntensityIn(e.target.value)} className="bg-[#111113] border border-white/10 rounded px-2 py-1 text-white">
                            {["Bassa", "Media", "Alta"].map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Tipo Attività:</span>
                          <select value={activityTypeIn} onChange={(e) => setActivityTypeIn(e.target.value)} className="bg-[#111113] border border-white/10 rounded px-2 py-1 text-white">
                            {["Pesi", "Calisthenics", "CrossFit", "Corsa/Cardio", "Sport misti"].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setIsEditingActivity(false)} className="w-1/2 bg-zinc-800 text-zinc-400 py-1.5 rounded-lg font-bold">Annulla</button>
                          <button onClick={handleUpdateActivityFromSettings} className="w-1/2 bg-cyan-500 text-black py-1.5 rounded-lg font-black">Salva e Ricalcola 🪄</button>
                        </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium font-mono">
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.02]"><span className="text-[9px] text-zinc-500 block">Frequenza</span><strong className="text-white">{user.workoutFrequency} volte/sett</strong></div>
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.02]"><span className="text-[9px] text-zinc-500 block">Intensità</span><strong className="text-white">{user.intensity}</strong></div>
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.02]"><span className="text-[9px] text-zinc-500 block">Attività</span><strong className="text-white truncate block">{user.activityType || "Pesi"}</strong></div>
                      </div>
                  )}
                </div>

                {/* SMART CARD COACH AI */}
                <div className="bg-[#111113] border-l-4 border-emerald-500 p-4 rounded-r-2xl rounded-l-md shadow-md">
                  <p className="text-xs text-zinc-200 leading-relaxed font-semibold">
                    🤖 <strong>Coach AI Cyber-Gym:</strong><br/>
                    <span className="text-zinc-300 italic font-normal mt-1 block">"{coachPhrase}"</span>
                  </p>
                </div>

                {/* MONITORAGGIO MACRONUTRIENTI */}
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span>Energia Assorbita</span>
                      <span className="text-emerald-400">{todayTotals.kcal} / {user.kcalTarget} kcal</span>
                    </div>
                    <div className="w-full h-1.5 bg-black rounded-full border border-white/5">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" style={{ width: `${completionPercentage}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Proteine</div>
                      <div className="font-mono font-black text-white mt-1 text-xs">{todayTotals.prot}g / {user.protTarget}g</div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Carbo</div>
                      <div className="font-mono font-black text-white mt-1 text-xs">{todayTotals.carbo}g / {user.carboTarget}g</div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Grassi</div>
                      <div className="font-mono font-black text-white mt-1 text-xs">{todayTotals.fat}g / {user.fatTarget}g</div>
                    </div>
                  </div>
                </div>

              </div>
          )}

          {/* --- TAB 2: LOG DEL CIBO --- */}
          {activeTab === "tracker" && (
              <div className="space-y-4">
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-emerald-400">🍎</span> Food Prompt</h3>
                  <form onSubmit={handleTrackFood} className="relative">
                    <input type="text" value={foodInput} onChange={(e) => setFoodInput(e.target.value)} disabled={loadingFood} placeholder='E.g. "150g pollo, 100g riso"' className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-sm text-white focus:outline-none placeholder:text-zinc-600" />
                    <button type="submit" disabled={loadingFood} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">↑</button>
                  </form>
                </div>
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4"><span className="text-amber-400">⚖️</span> Aggiorna Bilancia Peso</h3>
                  <input type="number" step="0.1" placeholder={`Attuale: ${currentWeight} kg`} className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white focus:outline-none placeholder:text-zinc-600 font-mono" onKeyDown={(e) => { if (e.key === "Enter") { handleUpdateWeightDirect(parseFloat((e.target as HTMLInputElement).value)); (e.target as HTMLInputElement).value = ""; } }} />
                </div>
              </div>
          )}

          {/* --- TAB 3: TIMELINE STORICA --- */}
          {activeTab === "calendario" && (
              <div className="space-y-3 pb-10">
                {Object.keys(db).length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-8">Il database è vuoto. Registra un pasto per iniziare.</p>
                ) : (
                    Object.keys(db).sort((a, b) => b.localeCompare(a)).map((dateStr) => {
                      const dayLog = db[dateStr]; const isExpanded = !!expandedDates[dateStr];
                      const dayKcal = dayLog.food ? dayLog.food.reduce((s, i) => s + i.macros.kcal, 0) : 0;
                      return (
                          <div key={dateStr} className="bg-[#111113] border border-white/[0.04] rounded-2xl overflow-hidden">
                            <button onClick={() => toggleDateExpansion(dateStr)} className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/[0.02]">
                              <div className="text-left">
                                <span className="text-sm font-bold text-white block">{dateStr === todayStr ? "Oggi" : new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
                                <span className="text-[10px] text-zinc-500 font-medium mt-0.5 block">{dayLog.food ? dayLog.food.length : 0} Pasti</span>
                              </div>
                              <div className="text-right flex items-center space-x-3">
                                <span className="text-sm font-mono font-black text-emerald-400">{dayKcal} kcal</span>
                                <span className="text-zinc-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
                              </div>
                            </button>
                            {isExpanded && dayLog.food && (
                                <div className="px-5 pb-4 pt-1 border-t border-white/5 space-y-3 bg-black/20">
                                  {dayLog.food.map(f => (
                                      <div key={f.id} className="text-zinc-300 text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/[0.02] flex justify-between items-center">
                                        <span className="truncate pr-2">{f.rawText}</span>
                                        <span className="text-emerald-400 font-mono font-bold">{f.macros.kcal} kcal</span>
                                      </div>
                                  ))}
                                </div>
                            )}
                          </div>
                      );
                    })
                )}
              </div>
          )}

          {/* --- TAB 4: TREND GEOMETRICO AD ALTA PRECISIONE --- */}
          {activeTab === "grafici" && (
              <div className="space-y-4">
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Mappatura Vettoriale Allineata</h4>
                  {isGraphReady ? (
                      <div className="w-full h-56 relative">

                        <svg viewBox="0 0 100 42" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          <path d={fillPath} fill="url(#histGrad)" />

                          {/* LINEE DI PROIEZIONE ASSI VERTICALI E ORIZZONTALMENTE */}
                          {graphCoords.map((coord, i) => (
                              <g key={`lines-${i}`} className="opacity-40">
                                <line x1="12" y1={coord.y} x2={coord.x} y2={coord.y} stroke="#27272a" strokeWidth="0.2" strokeDasharray="1,1" />
                                <line x1={coord.x} y1={coord.y} x2={coord.x} y2={35} stroke="#27272a" strokeWidth="0.2" strokeDasharray="1,1" />
                              </g>
                          ))}

                          <path d={pointsStr} fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />

                          {/* PUNTINI REALI + PESI ASSE Y + DATE ASSE X ALLINEATI */}
                          {graphCoords.map((coord, i) => (
                              <g key={`dots-${i}`}>
                                <circle cx={coord.x} cy={coord.y} r="1" fill="#09090b" stroke="#10b981" strokeWidth="0.6" />
                                <text x="2" y={coord.y + 1} fill="#71717a" fontSize="2.2" fontFamily="monospace" textAnchor="start">{coord.weight}kg</text>
                                <text x={coord.x} y="38" fill="#71717a" fontSize="2.2" fontFamily="monospace" textAnchor="middle">{coord.date}</text>
                              </g>
                          ))}

                          {/* PREDIZIONE FINALE TRATTEGGIATA AL TARGET UTENTE */}
                          {(() => {
                            const lastCoord = graphCoords[graphCoords.length - 1];
                            return (
                                <g>
                                  <line x1={lastCoord.x} y1={lastCoord.y} x2={targetCoord.x} y2={targetCoord.y} stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="1.5,1.5" className="opacity-80" />
                                  <line x1="12" y1={targetCoord.y} x2={targetCoord.x} y2={targetCoord.y} stroke="#06b6d4" strokeWidth="0.2" strokeDasharray="1,1" className="opacity-30" />
                                  <line x1={targetCoord.x} y1={targetCoord.y} x2={targetCoord.x} y2={35} stroke="#06b6d4" strokeWidth="0.2" strokeDasharray="1,1" className="opacity-30" />

                                  <circle cx={targetCoord.x} cy={targetCoord.y} r="1" fill="#09090b" stroke="#06b6d4" strokeWidth="0.6" />
                                  <text x="2" y={targetCoord.y + 1} fill="#06b6d4" fontSize="2.2" fontFamily="monospace" fontWeight="bold" textAnchor="start">{targetCoord.weight}kg</text>
                                  <text x={targetCoord.x} y="38" fill="#06b6d4" fontSize="2.2" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{targetCoord.date}</text>
                                </g>
                            );
                          })()}

                          <line x1="12" y1="35" x2="96" y2="35" stroke="#3f3f46" strokeWidth="0.3" />
                        </svg>

                        <div className="text-center text-[9px] text-zinc-500 font-mono tracking-wide mt-2">
                          🔮 <span className="text-cyan-400 font-bold">Linea Azzurra:</span> Traiettoria calcolata per l'obiettivo inserito in Onboarding.
                        </div>

                      </div>
                  ) : (
                      <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-2xl">
                        <p className="text-xs text-zinc-600 font-medium">Acquisizione vettori asse in corso...</p>
                      </div>
                  )}
                </div>
              </div>
          )}

        </div>

        {/* FLOATING BOTTOM NAVIGATION */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
          <nav className="bg-[#111113]/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-2 py-2 flex justify-around items-center shadow-xl">
            {[
              { id: "dashboard", label: "Hub", icon: "⚲" }, { id: "tracker", label: "Log", icon: "⊕" },
              { id: "calendario", label: "Timeline", icon: "▤" }, { id: "grafici", label: "Trend", icon: "◒" },
            ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-white/10 text-white" : "text-zinc-500"}`}>
                  <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
                  <span className="text-[8px] font-bold tracking-widest uppercase">{tab.label}</span>
                </button>
            ))}
          </nav>
        </div>
      </main>
  );
}