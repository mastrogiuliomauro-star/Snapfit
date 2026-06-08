import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { food } = await req.json();

        if (!food) {
            return NextResponse.json({ error: "Input mancante" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Chiave API Gemini assente sulle variabili d'ambiente" }, { status: 500 });
        }

        // Strutturazione del super-prompt per blindare la risposta in formato JSON pulito
        const systemPrompt = `Sei un nutrizionista sportivo esperto in bodybuilding e composizione corporea. Analizza questo input: "${food}".
    Se l'utente richiede schemi di allenamento o stringhe contenenti "array JSON/allenamento/schema", genera la struttura richiesta.
    Altrimenti, calcola i macronutrienti esatti del pasto basandoti sul peso (se non specificato, stima porzioni medie standard da palestra).
    Fai grandissima attenzione alla differenza tra cibi crudi e cotti (es. riso o pasta cotti pesano circa 2.5 volte di più a parità di kcal rispetto al crudo).
    Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, non racchiuderlo in blocchi markdown di codice (NO \`\`\`json), senza alcun testo extra o spiegazioni prima o dopo.
    Struttura macro richiesta: {"kcal": numero_intero, "prot": numero_intero, "carbo": numero_intero, "fat": numero_intero}`;

        // Chiamata HTTP Rest nativa all'endpoint di Google Gemini 3.1 Flash-Lite
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.1 // Massima rigidità per evitare calcoli fantasiosi
                    }
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            return NextResponse.json({ error: `Errore Server Google Gemini: ${errText}` }, { status: response.status });
        }

        const jsonRes = await response.json();
        const aiRawText = jsonRes.candidates[0].content.parts[0].text;

        // Parsing e pulizia del JSON sputato dall'AI
        const cleanJson = JSON.parse(aiRawText.trim());

        return NextResponse.json(cleanJson);

    } catch (error: any) {
        console.error("Errore interno di elaborazione:", error);
        return NextResponse.json({ error: "Errore durante l'elaborazione dei macro" }, { status: 500 });
    }
}