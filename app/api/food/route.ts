import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: Request) {
    try {
        const { food } = await req.json();

        if (!food) {
            return NextResponse.json({ error: "Input mancante" }, { status: 400 });
        }

        if (food.includes("array JSON") || food.includes("allenamento") || food.includes("schema")) {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: food,
            });

            const responseText = response.text?.trim() || "[]";

            const cleanJsonString = responseText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const workoutJson = JSON.parse(cleanJsonString);
            return NextResponse.json(workoutJson);
        }

        const promptDieta = `Sei un nutrizionista sportivo. Analizza questo alimento: "${food}". Rispondi ESCLUSIVAMENTE con un oggetto JSON avente questa struttura esatta, senza formattazione markdown, senza testo extra e senza spiegazioni: {"kcal": 0, "prot": 0, "carbo": 0, "fat": 0} Usa solo numeri interi. Se l'alimento è indefinito, stima al meglio.`;

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: promptDieta,
        });

        const responseText = response.text?.trim() || "{}";

        const cleanJsonString = responseText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const currentMacros = JSON.parse(cleanJsonString);
        return NextResponse.json(currentMacros);

    } catch (error: any) {
        console.error("Errore API Gemini:", error);
        return NextResponse.json({ error: "Errore durante l'elaborazione" }, { status: 500 });
    }
}