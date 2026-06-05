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
  name: string; email: string;
  weightInitial: number; weightTarget: number;
  height: number; age: number; gender: string;
  kcalTarget: number; protTarget: number; carboTarget: number; fatTarget: number;
  createdAt: string;
}

interface PopupFeedback { visible: boolean; title: string; macros?: Macro; }

export default function Home() {
  // --- NAVIGAZIONE (4 TAB ESSENZIALI) ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "tracker" | "calendario" | "grafici">("dashboard");
  const [todayStr, setTodayStr] = useState("");

  // --- STATI AUTH E ONBOARDING ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const [nameIn, setNameIn] = useState("");
  const [emailIn, setEmailIn] = useState("");
  const [passwordIn, setPasswordIn] = useState("");

  const [isOnboarding, setIsOnboarding] = useState(false);
  // Pre-compilati per hyper-flow
  const [heightIn, setHeightIn] = useState("178");
  const [weightIn, setWeightIn] = useState("75");
  const [ageIn, setAgeIn] = useState("28");
  const [weightTargetIn, setWeightTargetIn] = useState("80");
  const [kcalTargetIn, setKcalTargetIn] = useState("2850");

  // --- STATI DATABASE E TRACKING ---
  const [db, setDb] = useState<HistoryDatabase>({});
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foodInput, setFoodInput] = useState("");
  const [workoutInput, setWorkoutInput] = useState("");
  const [loadingFood, setLoadingFood] = useState(false);
  const [loadingWorkout, setLoadingWorkout] = useState(false);

  const [popup, setPopup] = useState<PopupFeedback>({ visible: false, title: "" });
  const [expandedDates, setExpandedDates] = useState<{ [key: string]: boolean }>({});

  // ==========================================
  // BOOTSTRAP ENGINE & MOCK DATA INJECTION
  // ==========================================
  useEffect(() => {
    const oggi = new Date().toISOString().split("T")[0];
    setTodayStr(oggi);

    const savedUser = localStorage.getItem("snapfit_user");
    let currentUser: UserProfile | null = null;
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
    }

    const savedDB = localStorage.getItem("snapfit_db");
    if (savedDB) setDb(JSON.parse(savedDB));

    let savedWeights = localStorage.getItem("snapfit_weight_logs");
    let parsedWeights: WeightLog[] = savedWeights ? JSON.parse(savedWeights) : [];

    // Inietta curva ipertrofica finta se vuoto per mostrare il potenziale della predizione
    if (parsedWeights.length <= 1) {
      const d1 = new Date(); d1.setDate(d1.getDate() - 21);
      const d2 = new Date(); d2.setDate(d2.getDate() - 14);
      const d3 = new Date(); d3.setDate(d3.getDate() - 7);

      const baseW = parsedWeights[0]?.weight || (currentUser ? currentUser.weightInitial : 75.0);

      parsedWeights = [
        { id: "m1", weight: baseW, date: d1.toISOString().split("T")[0] },
        { id: "m2", weight: baseW + 0.6, date: d2.toISOString().split("T")[0] },
        { id: "m3", weight: baseW + 1.1, date: d3.toISOString().split("T")[0] },
        { id: "m4", weight: baseW + 1.5, date: oggi }
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

  // ==========================================
  // LOGICA AUTH E ONBOARDING
  // ==========================================
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "register") setIsOnboarding(true);
    else {
      const mockProfile: UserProfile = {
        name: nameIn || "Atleta", email: emailIn,
        weightInitial: 75.0, weightTarget: 80.0,
        height: 178, age: 28, gender: "M",
        kcalTarget: 2850, protTarget: 160, carboTarget: 350, fatTarget: 80,
        createdAt: new Date().toISOString().split("T")[0]
      };
      setUser(mockProfile);
      localStorage.setItem("snapfit_user", JSON.stringify(mockProfile));
    }
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightIn);
    const kcal = parseInt(kcalTargetIn);
    const profile: UserProfile = {
      name: nameIn || "Atleta", email: emailIn,
      weightInitial: w, weightTarget: parseFloat(weightTargetIn),
      height: parseFloat(heightIn), age: parseInt(ageIn), gender: "M",
      kcalTarget: kcal,
      protTarget: Math.round(w * 2.2),
      fatTarget: Math.round((kcal * 0.25) / 9),
      carboTarget: Math.round((kcal - (w * 2.2 * 4) - ((kcal * 0.25))) / 4),
      createdAt: todayStr
    };
    setUser(profile);
    localStorage.setItem("snapfit_user", JSON.stringify(profile));
    saveWeightLogs([{ id: crypto.randomUUID(), weight: w, date: profile.createdAt }]);
    setIsOnboarding(false);
  };

  const handleUpdateWeightDirect = (newW: number) => {
    if (!user || isNaN(newW) || newW <= 0) return;
    const newLog: WeightLog = { id: crypto.randomUUID(), weight: newW, date: todayStr };
    const updatedLogs = [...weightLogs.filter(l => l.date !== todayStr), newLog].sort((a,b) => a.date.localeCompare(b.date));
    saveWeightLogs(updatedLogs);
    const updatedDB = { ...db };
    if (!updatedDB[todayStr]) updatedDB[todayStr] = { food: [], workouts: [] };
    updatedDB[todayStr].weightAtDate = newW;
    saveDatabase(updatedDB);
  };

  // ==========================================
  // FAST CHAT TRACKERS
  // ==========================================
  const handleTrackFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput.trim()) return;
    setLoadingFood(true);
    try {
      const res = await fetch("/api/food", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: foodInput }),
      });
      if (!res.ok) throw new Error();
      const data: Macro = await res.json();
      const now = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      const newFoodLog: FoodLog = { id: crypto.randomUUID(), time: now, rawText: foodInput, macros: data };
      const updatedDB = { ...db };
      if (!updatedDB[todayStr]) updatedDB[todayStr] = { food: [], workouts: [] };
      updatedDB[todayStr].food = [newFoodLog, ...updatedDB[todayStr].food];
      saveDatabase(updatedDB);
      setFoodInput("");
      triggerPopup("✅ Analisi Alimento Completata", data);
    } catch (err) {
      triggerPopup("❌ Rete instabile");
    } finally { setLoadingFood(false); }
  };

  const handleTrackWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutInput.trim()) return;
    setLoadingWorkout(true);
    try {
      const promptModificato = `Analizza sessione: "${workoutInput}". Estrai focus breve. JSON: {"summary": "Riassunto"}`;
      const res = await fetch("/api/food", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: promptModificato }),
      });
      const data = await res.json();
      const now = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      const newWorkoutLog: WorkoutLog = { id: crypto.randomUUID(), time: now, rawText: workoutInput, summary: data.summary || "Workout" };
      const updatedDB = { ...db };
      if (!updatedDB[todayStr]) updatedDB[todayStr] = { food: [], workouts: [] };
      updatedDB[todayStr].workouts = [newWorkoutLog, ...updatedDB[todayStr].workouts];
      saveDatabase(updatedDB);
      setWorkoutInput("");
      triggerPopup("⚡ Workout Registrato");
    } catch (err) {
      triggerPopup("❌ Rete instabile");
    } finally { setLoadingWorkout(false); }
  };

  // ==========================================
  // CORE METRICS & PREDICTIVE AI ENGINE
  // ==========================================
  const todayRecord = db[todayStr] || { food: [], workouts: [] };
  const currentWeight = weightLogs.find(l => l.date === todayStr)?.weight || weightLogs[weightLogs.length - 1]?.weight || (user ? user.weightInitial : 75);

  const todayTotals = todayRecord.food.reduce((acc, item) => ({
    kcal: acc.kcal + item.macros.kcal, prot: acc.prot + item.macros.prot,
    carbo: acc.carbo + item.macros.carbo, fat: acc.fat + item.macros.fat,
  }), { kcal: 0, prot: 0, carbo: 0, fat: 0 });

  const currentStreak = (() => {
    let streak = 0; let checkDate = new Date();
    while (true) {
      const dateString = checkDate.toISOString().split("T")[0];
      const log = db[dateString];
      if (log && (log.food.length > 0 || log.workouts.length > 0)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else { if (streak === 0 && dateString === todayStr) { checkDate.setDate(checkDate.getDate() - 1); continue; } break; }
    }
    return streak;
  })();

  const completionPercentage = Math.min(100, Math.round((todayTotals.kcal / (user?.kcalTarget || 1)) * 100));

  const getPredictionEngine = () => {
    if (!user || weightLogs.length < 2) return { status: "wait", msg: "Calibrazione dati in corso...", milestones: [] };

    const primo = weightLogs[0];
    const ultimo = weightLogs[weightLogs.length - 1];
    const giorni = Math.max(1, (new Date(ultimo.date).getTime() - new Date(primo.date).getTime()) / 86400000);
    const diffPeso = ultimo.weight - primo.weight;
    const velocityGiorno = diffPeso / giorni;

    const isGaining = user.weightTarget > user.weightInitial;
    const kgMancanti = user.weightTarget - ultimo.weight;

    if (velocityGiorno === 0 || (isGaining && velocityGiorno < 0) || (!isGaining && velocityGiorno > 0)) {
      return { status: "stalled", msg: "Aggiusta i macro per innescare il trend vettoriale.", milestones: [] };
    }

    const giorniTarget = kgMancanti / velocityGiorno;
    const weeksToTarget = Math.max(1, Math.ceil(giorniTarget / 7));

    const m1Weight = ultimo.weight + (kgMancanti * 0.33);
    const m2Weight = ultimo.weight + (kgMancanti * 0.66);

    const formatD = (daysToAdd: number) => {
      const d = new Date(); d.setDate(d.getDate() + daysToAdd);
      return d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
    };

    return {
      status: "active",
      msg: `Se mantieni questo ritmo raggiungerai il tuo obiettivo tra ${weeksToTarget} settimane.`,
      milestones: [
        { weight: m1Weight.toFixed(1), date: formatD(giorniTarget * 0.33) },
        { weight: m2Weight.toFixed(1), date: formatD(giorniTarget * 0.66) },
        { weight: user.weightTarget.toFixed(1), date: formatD(giorniTarget) }
      ]
    };
  };

  const prediction = getPredictionEngine();

  // ==========================================
  // GRAFICO VETTORIALE AVANZATO
  // ==========================================
  let targetY = 20, finalMin = 60, den = 1, pointsStr = "", fillPath = "", isGraphReady = false;

  if (user && weightLogs.length > 0) {
    const weightsArray = weightLogs.map(l => l.weight);
    const currentMax = Math.max(...weightsArray, user.weightTarget, user.weightInitial);
    const currentMinVal = Math.min(...weightsArray, user.weightTarget, user.weightInitial);

    const diff = currentMax - currentMinVal;
    const finalMax = diff === 0 ? currentMax + 2 : currentMax + 1;
    finalMin = diff === 0 ? currentMinVal - 2 : currentMinVal - 1;
    den = (finalMax - finalMin) <= 0 ? 1 : (finalMax - finalMin);
    targetY = 35 - ((user.weightTarget - finalMin) / den) * 30;

    if (!isNaN(targetY) && !isNaN(den)) {
      isGraphReady = true;
      const coords = weightLogs.map((log, idx) => ({
        x: (idx / Math.max(1, weightLogs.length - 1)) * 60, // Comprime storico al 60% per far spazio alla proiezione
        y: 35 - ((log.weight - finalMin) / den) * 30
      }));

      if (coords.length > 0) {
        pointsStr = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 0; i < coords.length - 1; i++) {
          const p0 = coords[i], p1 = coords[i + 1];
          const cpX1 = p0.x + (p1.x - p0.x) / 2, cpY1 = p0.y;
          const cpX2 = p0.x + (p1.x - p0.x) / 2, cpY2 = p1.y;
          pointsStr += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }
        fillPath = `${pointsStr} L ${coords[coords.length-1].x} 40 L ${coords[0].x} 40 Z`;
      }
    }
  }

  // --- RENDER ONBOARDING ---
  if (!user) {
    if (isOnboarding) {
      return (
          <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
              <h2 className="text-xs font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-widest text-center">Inizializzazione Motore</h2>
              <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Altezza (cm)</label>
                    <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} required className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Peso (kg)</label>
                    <input type="number" step="0.1" value={weightIn} onChange={(e) => setWeightIn(e.target.value)} required className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Target (kg)</label>
                    <input type="number" step="0.1" value={weightTargetIn} onChange={(e) => setWeightTargetIn(e.target.value)} required className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-wide">Kcal Target</label>
                    <input type="number" value={kcalTargetIn} onChange={(e) => setKcalTargetIn(e.target.value)} required className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 text-sm text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-zinc-100 text-black font-black text-xs py-4 rounded-xl uppercase tracking-wider hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">Attiva SnapFit</button>
              </form>
            </div>
          </main>
      );
    }

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
          {/* Glow Effects Background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8 relative z-10">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tighter uppercase">SNAPFIT AI</h1>
              <p className="text-xs text-zinc-500 font-medium">Predictive Body Architect</p>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase pl-1">Nome</label>
                    <input type="text" value={nameIn} onChange={(e) => setNameIn(e.target.value)} required className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase pl-1">Email</label>
                <input type="email" value={emailIn} onChange={(e) => setEmailIn(e.target.value)} required className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)] font-black text-xs py-4 rounded-xl uppercase tracking-wider mt-4">Accedi al Sistema</button>
            </form>
            <button onClick={() => setAuthMode(authMode === "register" ? "login" : "register")} className="text-xs text-zinc-500 font-medium block mx-auto hover:text-white transition-colors">Switch Auth Mode</button>
          </div>
        </main>
    );
  }

  // --- RENDER APP ---
  return (
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center p-4 pb-28 font-sans relative overflow-x-hidden">

        {/* POPUP FEEDBACK PREMIUM */}
        {popup.visible && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(16,185,129,0.15)] z-50 animate-fadeIn flex flex-col items-center">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-wide">{popup.title}</p>
              {popup.macros && <p className="text-[10px] text-zinc-400 mt-1 font-mono">{popup.macros.kcal} kcal • P:{popup.macros.prot}g | C:{popup.macros.carbo}g | F:{popup.macros.fat}g</p>}
            </div>
        )}

        {/* NAVBAR */}
        <div className="w-full max-w-md flex justify-between items-center mb-6 px-1 mt-2">
          <div>
            <h1 className="text-sm font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-widest uppercase">SNAPFIT AI</h1>
            <p className="text-[10px] text-zinc-500 font-medium">Operativo: {user.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full transition-all duration-300 ${currentStreak > 0 ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-zinc-900 border border-white/5 text-zinc-600"}`}>
              <span className="text-[10px] animate-pulse">🔥</span>
              <span className="text-xs font-mono font-black">{currentStreak}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md space-y-4">

          {/* --- DASHBOARD (HUB) --- */}
          {activeTab === "dashboard" && (
              <div className="space-y-4 animate-fadeIn">

                {/* LA KILLER FEATURE: CARD PREVISIONE AI */}
                <div className="bg-gradient-to-b from-[#111113] to-[#0a0a0c] border border-white/[0.04] p-5 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-50"></div>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-emerald-400">🎯</span>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">PREVISIONE AI</h3>
                  </div>

                  <p className="text-[13px] font-medium text-zinc-300 leading-relaxed mb-6">
                    {prediction.msg}
                  </p>

                  {/* Milestones Visuali */}
                  {prediction.status === "active" && (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:to-transparent">
                        {prediction.milestones.map((ms, i) => (
                            <div key={i} className="relative flex items-center justify-between pl-6">
                              <div className="absolute left-0 w-3 h-3 bg-[#09090b] border-2 border-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                              <span className="text-sm font-black text-white font-mono">{ms.weight} kg</span>
                              <span className="text-xs font-medium text-zinc-500 bg-black/40 px-2 py-1 rounded-lg border border-white/5">{ms.date}</span>
                            </div>
                        ))}
                      </div>
                  )}
                  {prediction.status !== "active" && (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                        <p className="text-xs text-zinc-500">Rilevamento dati insufficienti. Continua a tracciare per generare le milestone.</p>
                      </div>
                  )}
                </div>

                {/* PROGRESSO E MACROS */}
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span>Energia Assorbita</span>
                      <span className="text-emerald-400">{todayTotals.kcal} / {user.kcalTarget} kcal</span>
                    </div>
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionPercentage}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Proteine</div>
                      <div className="font-mono font-black text-white mt-1 text-sm">{todayTotals.prot}<span className="text-zinc-600 text-xs">/{user.protTarget}g</span></div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Carbo</div>
                      <div className="font-mono font-black text-white mt-1 text-sm">{todayTotals.carbo}<span className="text-zinc-600 text-xs">/{user.carboTarget}g</span></div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Grassi</div>
                      <div className="font-mono font-black text-white mt-1 text-sm">{todayTotals.fat}<span className="text-zinc-600 text-xs">/{user.fatTarget}g</span></div>
                    </div>
                  </div>
                </div>

              </div>
          )}

          {/* --- TRACKER: SNAP LOG --- */}
          {activeTab === "tracker" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-emerald-400">🍎</span> Food Prompt</h3>
                  </div>
                  <form onSubmit={handleTrackFood} className="relative">
                    <input type="text" value={foodInput} onChange={(e) => setFoodInput(e.target.value)} disabled={loadingFood} placeholder='E.g. "150g pollo, 200g riso"' className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-600" />
                    <button type="submit" disabled={loadingFood} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl flex items-center justify-center transition-colors">
                      {loadingFood ? "..." : "↑"}
                    </button>
                  </form>
                </div>

                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><span className="text-cyan-400">🏋️‍♂️</span> Workout Prompt</h3>
                  </div>
                  <form onSubmit={handleTrackWorkout} className="relative">
                    <input type="text" value={workoutInput} onChange={(e) => setWorkoutInput(e.target.value)} disabled={loadingWorkout} placeholder='E.g. "Petto pesante 45 min"' className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-600" />
                    <button type="submit" disabled={loadingWorkout} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-xl flex items-center justify-center transition-colors">
                      {loadingWorkout ? "..." : "↑"}
                    </button>
                  </form>
                </div>

                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4"><span className="text-amber-400">⚖️</span> Aggiorna Vettore Peso</h3>
                  <input type="number" step="0.1" placeholder={`Attuale: ${currentWeight} kg`} className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600 font-mono" onKeyDown={(e) => { if (e.key === "Enter") { handleUpdateWeightDirect(parseFloat((e.target as HTMLInputElement).value)); (e.target as HTMLInputElement).value = ""; } }} />
                </div>
              </div>
          )}

          {/* --- TIMELINE --- */}
          {activeTab === "calendario" && (
              <div className="space-y-3 animate-fadeIn pb-10">
                {Object.keys(db).length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-8">Il database è in attesa di dati.</p>
                ) : (
                    Object.keys(db).sort((a, b) => b.localeCompare(a)).map((dateStr) => {
                      const dayLog = db[dateStr];
                      const isExpanded = !!expandedDates[dateStr];
                      const dayKcal = dayLog.food.reduce((s, i) => s + i.macros.kcal, 0);

                      return (
                          <div key={dateStr} className="bg-[#111113] border border-white/[0.04] rounded-2xl overflow-hidden transition-all duration-200">
                            <button onClick={() => toggleDateExpansion(dateStr)} className="w-full px-5 py-4 flex justify-between items-center hover:bg-white/[0.02]">
                              <div className="text-left">
                                <span className="text-sm font-bold text-white block">{dateStr === todayStr ? "Oggi" : new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
                                <span className="text-[10px] text-zinc-500 font-medium mt-0.5 block">{dayLog.workouts.length} Workout • {dayLog.food.length} Pasti</span>
                              </div>
                              <div className="text-right flex items-center space-x-3">
                                <span className="text-sm font-mono font-black text-emerald-400">{dayKcal} kcal</span>
                                <span className="text-zinc-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
                              </div>
                            </button>
                            {isExpanded && (
                                <div className="px-5 pb-4 pt-1 border-t border-white/5 space-y-3 bg-black/20">
                                  {dayLog.food.length > 0 && (
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Nutrizione</span>
                                        {dayLog.food.map(f => (
                                            <div key={f.id} className="text-zinc-300 text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/[0.02] flex justify-between items-center">
                                              <span className="truncate pr-2">{f.rawText}</span>
                                              <span className="text-emerald-400 font-mono font-bold">{f.macros.kcal}</span>
                                            </div>
                                        ))}
                                      </div>
                                  )}
                                  {dayLog.workouts.length > 0 && (
                                      <div className="space-y-1.5 pt-2">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Training</span>
                                        {dayLog.workouts.map(w => (
                                            <div key={w.id} className="text-cyan-100/80 text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/[0.02]">
                                              {w.rawText} <span className="text-cyan-500/50 font-mono ml-1">[{w.summary}]</span>
                                            </div>
                                        ))}
                                      </div>
                                  )}
                                </div>
                            )}
                          </div>
                      );
                    })
                )}
              </div>
          )}

          {/* --- GRAFICO VETTORIALE (TREND) --- */}
          {activeTab === "grafici" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-3xl shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Trend Curve</h4>
                  </div>

                  {isGraphReady && user ? (
                      <div className="w-full h-48 relative">
                        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Area riempimento storico */}
                          <path d={fillPath} fill="url(#histGrad)" />

                          {/* Target Line Fissa */}
                          <line x1="0" y1={targetY} x2="100" y2={targetY} stroke="#3f3f46" strokeWidth="0.3" strokeDasharray="1,1" />

                          {/* Curva Bézier Storico */}
                          <path d={pointsStr} fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />

                          {/* Linea Previsione Futura */}
                          {(() => {
                            const ultimoLog = weightLogs[weightLogs.length - 1];
                            const startY = 35 - ((ultimoLog.weight - finalMin) / den) * 30;
                            const endY = 35 - ((user.weightTarget - finalMin) / den) * 30;
                            return <line x1="60" y1={startY} x2="100" y2={endY} stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="1.5,1.5" className="opacity-70" />;
                          })()}

                          {/* Nodi (Dots) Storici */}
                          {weightLogs.map((log, idx) => {
                            const x = (idx / Math.max(1, weightLogs.length - 1)) * 60;
                            const y = 35 - ((log.weight - finalMin) / den) * 30;
                            return <circle key={idx} cx={x} cy={y} r="1" fill="#09090b" stroke="#10b981" strokeWidth="0.5" />;
                          })}
                        </svg>

                        {/* Legenda Base Grafo */}
                        <div className="flex justify-between text-[9px] text-zinc-500 mt-4 font-mono font-medium border-t border-white/5 pt-3">
                          <span>INIZIO<br/><span className="text-zinc-300">{user.weightInitial}kg</span></span>
                          <span className="text-center">OGGI<br/><span className="text-emerald-400">{currentWeight}kg</span></span>
                          <span className="text-right">TARGET<br/><span className="text-cyan-400">{user.weightTarget}kg</span></span>
                        </div>
                      </div>
                  ) : (
                      <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-2xl">
                        <p className="text-xs text-zinc-600 font-medium">Acquisizione vettori in corso...</p>
                      </div>
                  )}
                </div>
              </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION (FLOATING APPLE STYLE) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
          <nav className="bg-[#111113]/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-2 py-2 flex justify-around items-center shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            {[
              { id: "dashboard", label: "Hub", icon: "⚲" }, // Usiamo icone pulite tipografiche per stile minimal
              { id: "tracker", label: "Log", icon: "⊕" },
              { id: "calendario", label: "Timeline", icon: "▤" },
              { id: "grafici", label: "Trend", icon: "◒" },
            ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                  <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
                  <span className="text-[8px] font-bold tracking-widest uppercase">{tab.label}</span>
                </button>
            ))}
          </nav>
        </div>

      </main>
  );
}