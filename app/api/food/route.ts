import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
    Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, avente questa struttura: {"kcal": numero_intero, "prot": numero_intero, "carbo": numero_intero, "fat": numero_intero}.
    Non aggiungere altre spiegazioni o testo.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
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

        // Controllo di sicurezza sulla struttura della risposta di Google
        if (!jsonRes.candidates || !jsonRes.candidates[0] || !jsonRes.candidates[0].content || !jsonRes.candidates[0].content.parts || !jsonRes.candidates[0].content.parts[0]) {
            console.error("Struttura Gemini inattesa:", JSON.stringify(jsonRes));
            return NextResponse.json({ error: "Risposta malformata da parte di Google AI" }, { status: 500 });
        }

        let aiRawText = jsonRes.candidates[0].content.parts[0].text.trim();

        // Pulizia super-blindata contro i blocchi di codice Markdown (```json ... ```)
        if (aiRawText.includes("```")) {
            aiRawText = aiRawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        }

        // Parsing finale sicuro
        const cleanJson = JSON.parse(aiRawText);
        return NextResponse.json(cleanJson);

    } catch (error: any) {
        console.error("Crash verticale della rotta:", error);
        return NextResponse.json({ error: "Errore interno durante il calcolo dei macro" }, { status: 500 });
    }
}