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

        const promptDieta = `Sei un nutrizionista sportivo esperto in bodybuilding. Analizza questo input: "${food}".
    Calcola i macronutrienti esatti del pasto basandoti sul peso (se non specificato, stima porzioni medie standard da palestra).
    Fai grandissima attenzione alla differenza tra cibi crudi e cotti (es. riso o pasta cotti pesano circa 2.5 volte di più a parità di kcal rispetto al crudo).
    Rispondi ESCLUSIVAMENTE con un oggetto JSON valido avente questa struttura esatta, senza formattazione markdown (NO blocchi \`\`\`json), senza testo extra e senza spiegazioni prima o dopo: 
    {"kcal": 0, "prot": 0, "carbo": 0, "fat": 0}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptDieta }] }],
                    generationConfig: {
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
        let aiRawText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Pulizia totale da qualsiasi residuo di blocco codice markdown
        aiRawText = aiRawText.replace(/```json/gi, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(aiRawText);

        // Mappatura forzata in uscita per evitare campi vuoti
        return NextResponse.json({
            kcal: Math.round(Number(parsed.kcal || parsed.Kcal || 0)),
            prot: Math.round(Number(parsed.prot || parsed.Prot || parsed.pro || 0)),
            carbo: Math.round(Number(parsed.carbo || parsed.Carbo || parsed.carb || 0)),
            fat: Math.round(Number(parsed.fat || parsed.Fat || parsed.fats || 0))
        });

    } catch (error: any) {
        console.error("Crash della rotta backend:", error);
        return NextResponse.json({ kcal: 0, prot: 0, carbo: 0, fat: 0 }, { status: 200 });
    }
}