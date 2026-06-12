"use client";

import { useState, useEffect } from "react";

interface FoodLog {
    id: string;
    time: string;
    rawText: string;
    macros: { kcal: number; prot: number; carbo: number; fat: number };
}

interface DayRecord {
    food: FoodLog[];
    workouts: any[];
}

export default function AdminDashboard() {
    const [totalUsers, setTotalUsers] = useState(1); // Tu sei l'admin supremo
    const [totalFoodLogs, setTotalFoodLogs] = useState(0);
    const [activeToday, setActiveToday] = useState(0);
    const [lastActivity, setLastActivity] = useState("--:--");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Legge il database reale memorizzato sul browser
        const localData = localStorage.getItem("snapfit_db");
        if (localData) {
            try {
                const db = JSON.parse(localData);
                let logsCount = 0;
                let todayHasLogs = 0;

                // Calcoliamo la data di oggi in formato locale per il controllo
                const todayStr = new Date().toLocaleDateString("it-IT");

                Object.keys(db).forEach((dateKey) => {
                    const dayRecord = db[dateKey] as DayRecord;
                    if (dayRecord.food) {
                        logsCount += dayRecord.food.length;

                        // Se ci sono inserimenti nella data odierna, l'utente è attivo oggi
                        if (dateKey === todayStr && dayRecord.food.length > 0) {
                            todayHasLogs = 1;
                        }
                    }
                });

                setTotalFoodLogs(logsCount);
                setActiveToday(todayHasLogs);
            } catch (e) {
                console.error("Errore lettura DB admin", e);
            }
        }

        setLastActivity(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] text-zinc-500 flex items-center justify-center font-mono text-xs">
                ⚡ ANALISI RETE DI MONITORAGGIO...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 p-6 font-sans">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8 border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent uppercase tracking-wider">
                        Snapfit HQ // Pannello Real-Time
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Sincronizzazione locale: {lastActivity}</p>
                </div>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-mono font-bold animate-pulse">
          ● UTENTE ATTIVO
        </span>
            </div>

            {/* Griglia Metriche */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Sviluppatori Registrati</span>
                    <div className="text-3xl font-mono font-black text-white">{totalUsers}</div>
                    <p className="text-[10px] text-zinc-400">Admin della piattaforma</p>
                </div>

                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Utenti Attivi Oggi</span>
                    <div className="text-3xl font-mono font-black text-emerald-400">{activeToday}</div>
                    <p className="text-[10px] text-zinc-400">Stato interazione odierna</p>
                </div>

                <div className="bg-[#111113] border border-white/[0.04] p-5 rounded-2xl sm:col-span-2 p-6">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Totale Pasti Tracciati dall'AI</span>
                    <div className="text-4xl font-mono font-black text-amber-400">
                        {totalFoodLogs} <span className="text-sm text-zinc-500 font-sans font-normal">inserimenti salvati in memoria</span>
                    </div>
                </div>

            </div>
        </main>
    );
}