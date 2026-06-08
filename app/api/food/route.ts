import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { food } = await req.json();

        if (!food) {
            return NextResponse.json({ error: "Input mancante" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Chiave API assente su Vercel." }, { status: 500 });
        }

        const systemPrompt = `Sei un nutrizionista sportivo esperto in bodybuilding. Analizza questo input: "${food}".
    Calcola i macronutrienti esatti del pasto basandoti sul peso (se non specificato, stima porzioni medie standard da palestra).
    Fai grandissima attenzione alla differenza tra cibi crudi e cotti (es. riso o pasta cotti pesano circa 2.5 volte di più a parità di kcal rispetto al crudo).
    Rispondi fornendo un oggetto JSON valido.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        // Questo forza Google a sputare SOLO ed esclusivamente JSON strutturato
                        responseMimeType: "application/json",
                        temperature: 0.1
                    }
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            return NextResponse.json({ error: `Errore Google: ${errText}` }, { status: response.status });
        }

        const jsonRes = await response.json();

        // Estrazione sicura del testo
        const aiRawText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiRawText) {
            return NextResponse.json({ error: "Risposta vuota dall'AI" }, { status: 500 });
        }

        const cleanJson = JSON.parse(aiRawText.trim());
        return NextResponse.json(cleanJson);

    } catch (error: any) {
        console.error("Crash della rotta:", error);
        return NextResponse.json({ error: "Errore interno durante il calcolo" }, { status: 500 });
    }
}