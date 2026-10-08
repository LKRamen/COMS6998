import "server-only";
import { validateCaptions } from "../caption-input";
export function generationSettings(model: string) {
 return { temperature: 0.9, maxOutputTokens: 4096, responseMimeType: "application/json", ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: "low" } } : {}) };
}
export function geminiConfig() {
 const key = process.env.GEMINI_API_KEY?.trim(); const model = process.env.GEMINI_MODEL?.trim();
 if (!key || !model || !/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("Caption generation is not configured yet. Your saved drafts are safe.");
 return { key, model };
}
export async function generateCaptions(input: { image: Buffer; systemPrompt: string; userPrompt: string }): Promise<string[]> {
 const { key, model } = geminiConfig();
 let response: Response;
 try {
  response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
   method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(45_000), cache: "no-store",
   body: JSON.stringify({ systemInstruction: { parts: [{ text: input.systemPrompt }] }, contents: [{ role: "user", parts: [{ text: input.userPrompt }, { inlineData: { mimeType: "image/jpeg", data: input.image.toString("base64") } }] }],
    generationConfig: { ...generationSettings(model), responseSchema: { type: "OBJECT", properties: { captions: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 } }, required: ["captions"] } },
   }),
  });
 } catch { throw new Error("The AI request timed out or could not connect. Your draft is saved; try again."); }
 if (response.status === 429) throw new Error("The AI provider is temporarily at its limit. Please try again later.");
 if (!response.ok) throw new Error("The AI provider could not complete this request. Please try again later.");
 let data;
 try { data = await response.json(); }
 catch { throw new Error("The AI did not return a valid response. Your draft is saved; try again."); }
 const candidate = data.candidates?.[0];
 if (data.promptFeedback?.blockReason || !candidate || candidate.finishReason !== "STOP") throw new Error("The AI could not generate captions for this request. Try another photo or context.");
 try { return validateCaptions(JSON.parse(candidate.content.parts.map((part: { text?: string }) => part.text ?? "").join(""))); }
 catch { throw new Error("The AI did not return three valid, distinct captions. Please try again."); }
}
