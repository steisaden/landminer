import { GoogleGenAI } from "@google/genai";
import { useAppStore } from "../store/useAppStore";

export async function generateDealSummary(
  sellerName: string,
  motivation: string,
  propertyAddress: string,
  askingPrice?: number | null,
  tags?: string[]
): Promise<string> {
  const prompt = `
You are an expert real estate acquisitions manager. Provide a 1-3 sentence summary of this deal, identifying the likely distress type and recommending the next best action.

Lead Details:
- Name: ${sellerName}
- Address: ${propertyAddress}
- Motivation/Notes: ${motivation}
${askingPrice ? `- Asking Price: $${askingPrice}` : ""}
${tags && tags.length > 0 ? `- Distress Tags: ${tags.join(', ')}` : ""}

Format your response as a direct summary.
`;

  return executeAI(prompt);
}

export async function generateFollowUpMessage(
  sellerName: string,
  motivation: string,
  propertyAddress: string,
  askingPrice?: number | null,
  businessName?: string,
  followUpStyle?: string,
  notes?: string
): Promise<string> {
  const prompt = `
You are an expert real estate wholesaler. Write a short, friendly, and persuasive SMS follow-up message to a seller.

Lead Details:
- Name: ${sellerName}
- Address: ${propertyAddress}
- Motivation/Notes: ${motivation}
${askingPrice ? `- Asking Price: $${askingPrice}` : ""}
${notes ? `- Detailed Notes/Signals: ${notes}` : ""}

Business Context:
- Your Business Name: ${businessName || "My Real Estate Company"}
- Tone of Voice: ${followUpStyle || "Friendly"}

Goal: Re-engage the seller to see if they are still open to a cash offer. If there are notes about civic signals or distress indicators (like tall weeds or structural damage), craft the message to mention that we noticed the property and can take it off their hands in "as-is" condition, but do it subtly and politely.
Keep it under 320 characters. It should sound human, casual, and empathetic. Do NOT include placeholders like [Your Name]. Just write the message body directly to the seller as if you are the buyer.
`;

  return executeAI(prompt);
}

async function executeAI(prompt: string, fallbackModelStr?: string): Promise<string> {
  const { activeAiProvider, apiKeys, selectedModels } = useAppStore.getState();
  
  try {
    if (activeAiProvider === "openai" && apiKeys.openai) {
      const model = selectedModels["openai"] || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response";
    }

    if (activeAiProvider === "claude" && apiKeys.claude) {
      const model = selectedModels["claude"] || "claude-3-haiku-20240307";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKeys.claude,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerously-allow-browser": "true"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      return data.content?.[0]?.text || "No response";
    }

    if (activeAiProvider === "ollama") {
      const model = selectedModels["ollama"] || "llama3";
      const baseUrl = apiKeys.ollama || "http://localhost:11434";
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false
        })
      });
      const data = await res.json();
      return data.response || "No response";
    }

    if (activeAiProvider === "qwen" && apiKeys.qwen) {
      const model = selectedModels["qwen"] || "qwen-plus";
      const res = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeys.qwen}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response";
    }

    if (activeAiProvider === "openrouter" && apiKeys.openrouter) {
      const model = selectedModels["openrouter"] || "openrouter/free";
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeys.openrouter}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Distressed Deal AI"
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response";
    }

    if (activeAiProvider === "opencode" && apiKeys.opencode) {
      // Assuming opencode is OpenAI compatible
      const model = selectedModels["opencode"] || "meta-llama/Meta-Llama-3-8B-Instruct";
      const res = await fetch("https://api.opencode.so/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeys.opencode}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "No response";
    }

    // Default to Gemini (system configured or user own key)
    const geminiKey = apiKeys.gemini || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        throw new Error("Gemini API key is missing. Please check your settings.");
    }
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    
    // Fallback if no opencode/others is mapped here: default generic gen
    const model = selectedModels["gemini"] || fallbackModelStr || "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Could not generate message. Please try again.";

  } catch (error) {
    console.error("AI Error:", error);
    return `Error generating message with provider limits or missing key.`;
  }
}

export async function analyzePropertyImage(base64Image: string, address: string): Promise<string> {
  const prompt = `Analyze this property image for a real estate wholesaler. Detect any distress signals such as damaged roof, boarded windows, overgrown yard, peeling paint, structural issues, or signs of vacancy.
Address (Approximate): ${address}

Return ONLY a JSON object with this exact structure:
{
  "summary": "Detailed description of the property distress and overall state",
  "distressSignals": ["signal 1", "signal 2"],
  "tags": ["vacant", "distressed", "fire-damage", "hoarder house", "tall-grass"]
}

No other text or explanations. JSON only.`;

  return executeAIVision(prompt, base64Image);
}

async function executeAIVision(prompt: string, base64Image: string): Promise<string> {
  const { activeAiProvider, apiKeys, selectedModels } = useAppStore.getState();

  // Extract mime type and base64 data
  const mimeTypeMatch = base64Image.match(/^data:([^;]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
  const base64Data = base64Image.replace(/^data:[^;]+;base64,/, "");

  try {
    if (activeAiProvider === "openai" && apiKeys.openai) {
      const model = selectedModels["openai"] || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "{}";
    }

    if (activeAiProvider === "claude" && apiKeys.claude) {
      const model = selectedModels["claude"] || "claude-3-haiku-20240307";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKeys.claude,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerously-allow-browser": "true"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", source: { type: "base64", media_type: mimeType === "image/png" ? "image/png" : "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });
      const data = await res.json();
      return data.content?.[0]?.text || "{}";
    }

    // Default to Gemini (system configured or user own key)
    const geminiKey = apiKeys.gemini || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        throw new Error("Gemini API key is missing. Please provide it in Settings.");
    }
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    
    const model = selectedModels["gemini"] || "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: mimeType } }
        ]
      },
    });
    return response.text || "{}";

  } catch (error) {
    console.error("AI Vision Error:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        throw error;
    }
    throw new Error("Vision analysis failed. Check your API key and model selection.");
  }
}

export async function analyzeDocumentText(documentText: string, context: string = ""): Promise<string> {
  const prompt = `You are an expert real estate attorney and wholesaler. Analyze this document text.
Context: ${context}

Identify:
1. Key financial terms (Price, EMD, Close Date).
2. Contingencies or "Weasel Clauses" (Inspection, Financing, Subject-To).
3. Any hidden risks, odd fees, or red flags before the wholesaler signs.

Format the response as clear markdown with bullet points and bold emphasis.
Here is the document text:
${documentText.slice(0, 30000)}
`;

  return executeAI(prompt);
}

export async function askPipeline(query: string, pipelineContext: string): Promise<string> {
  const prompt = `You are an AI assistant for a real estate wholesaler. The user is asking a question about their pipeline and leads database.
Answer the question based ONLY on the provided pipeline data.

Pipeline Data:
${pipelineContext.slice(0, 50000)} /* limit context arbitrarily here to fit most models, although many support > 50k */

User Question: ${query}
`;
  return executeAI(prompt);
}
export async function scrubLeadsBatch(leadsChunk: any[]): Promise<any[]> {
  const prompt = `You are an expert real estate wholesaler. I am giving you a JSON array of imported leads.
Analyze their notes and attributes (e.g. price, tags). Assign an "Opportunity Score" from 0 to 100 for each, and extract the motivation cleanly.
Return a strictly formatted JSON array containing objects with the exact same order and length:
[
  { "opportunityScore": 85, "motivation": "Cleaned up motivation", "distressTags": ["vacant", "probate"] },
  ...
]

Do not return anything except the JSON array.
Here is the input:
${JSON.stringify(leadsChunk, null, 2)}
`;

  try {
    const response = await executeAI(prompt);
    const cleanStr = response.replace(/```json\n?|\n?```/g, "").trim();
    const scored = JSON.parse(cleanStr);
    if (Array.isArray(scored) && scored.length === leadsChunk.length) {
      return leadsChunk.map((lead, idx) => ({
        ...lead,
        opportunityScore: scored[idx].opportunityScore || 50,
        motivation: scored[idx].motivation || lead.motivation,
        tags: [...(lead.tags || []), ...(scored[idx].distressTags || [])]
      }));
    }
  } catch(e) {
    console.error("Scrub error", e);
  }
  
  // fallback if AI failed or format is bad
  return leadsChunk.map(lead => ({
     ...lead,
     opportunityScore: 50
  }));
}
