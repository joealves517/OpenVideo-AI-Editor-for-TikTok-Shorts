import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { getTools } from "./tools";
import { buildAssetInstruction, buildMessageContent } from "./utils";

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash-lite"),
});

const SYSTEM_PROMPT = `You are a professional Multimodal Video Assistant.
Your goal is to help users analyze, explain, and edit their video projects.

CORE CAPABILITIES:
1. ANALYSIS: Use the provided media (video, audio, images) in the conversation to explain content, describe scenes, or answer questions.
2. EDITING: Use tools to modify the project (add/remove/update clips, transitions, and effects).
3. SEARCH: Find and add stock media from Pexels.
4. AUDIO: Generate voiceovers using ElevenLabs.
5. NAVIGATION: Move the playhead to specific times.

RULES:
- When asked to explain or describe, use your multimodal vision/hearing capabilities.
- When an edit is requested, use the appropriate tool.
- For NEW assets, generate a unique targetId (e.g., text_1738086000000_a7x). Default timing is 0-5s unless specified.
- Use the current playhead position [CURRENT_TIME] as a reference when adding assets if no specific time is mentioned.
- Respond naturally in the user's language. Do NOT expose internal IDs.`;

/* ---------------- FLOW ---------------- */

export const chatFlow = ai.defineFlow(
  {
    name: "chatFlow",
    inputSchema: z.object({
      message: z.string(),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "model"]),
            content: z.string(),
          }),
        )
        .optional(),
      metadata: z
        .object({
          existingAssets: z.array(z.any()).optional(),
          selectedAssets: z.array(z.any()).optional(),
          currentTime: z.number().optional().describe("Current playhead position in seconds"),
        })
        .optional(),
    }),
    outputSchema: z.object({
      reply: z.string(),
    }),
    streamSchema: z.string(),
  },
  async ({ message, history, metadata }, { sendChunk }) => {
    const assets = metadata?.selectedAssets?.length
      ? metadata.selectedAssets
      : metadata?.existingAssets;
    const assetsContext = assets?.map(
      (asset, index) => buildAssetInstruction(asset, index === 0), // marcamos el primero como seleccionado
    );
    const context = (assetsContext || []).join("\n\n");

    // Build the complete messages array for multi-turn chat
    const genkitMessages: Array<{ role: "user" | "model"; content: any }> = [];

    // 1. Add chat history
    if (history && history.length > 0) {
      for (const h of history) {
        genkitMessages.push({
          role: h.role as "user" | "model",
          content: [{ text: h.content }],
        });
      }
    }

    // 2. Add current message with current time, timeline context, and multimodal assets
    const currentMessageParts: any[] = [
      {
        text: `[CURRENT_TIME]: ${metadata?.currentTime || 0}s\n\n[CONTEXT]:\n${context}\n\n[USER]: ${message}`,
      },
    ];

    if (assets?.length) {
      const assetParts = buildMessageContent(assets);
      currentMessageParts.push(...assetParts);
    }

    genkitMessages.push({
      role: "user",
      content: currentMessageParts,
    });

    const { stream, response } = ai.generateStream({
      system: SYSTEM_PROMPT,
      config: {
        thinkingConfig: {
          thinkingBudget: 2000,
          includeThoughts: true,
        },
      },
      messages: genkitMessages,
      tools: getTools(),
    });

    const toolsQueue: Array<{ id?: string; name: string; arg: any; response?: any }> = [];

    for await (const chunk of stream) {
      if (chunk.text) {
        sendChunk(
          JSON.stringify({
            event: "text",
            text: chunk.text,
          }),
        );
      }

      if (chunk.role === "model" && chunk.content) {
        for (const part of chunk.content) {
          if (part.reasoning) {
            sendChunk(
              JSON.stringify({
                event: "reasoning",
                text: part.reasoning,
              }),
            );
          }
          if (part.toolRequest) {
            const req = part.toolRequest;
            const existing = toolsQueue.find((t) => {
              if (req.ref && t.id) return t.id === req.ref;
              return t.name === req.name && JSON.stringify(t.arg) === JSON.stringify(req.input);
            });
            if (existing) {
              existing.arg = req.input;
              if (req.ref) existing.id = req.ref;
            } else {
              toolsQueue.push({ id: req.ref, name: req.name, arg: req.input });
            }
          }
        }
      }

      if (chunk.role === "tool" && chunk.content) {
        for (const part of chunk.content) {
          if (part.toolResponse) {
            const res = part.toolResponse;
            const tool = toolsQueue.find((t) => {
              if (res.ref && t.id) return t.id === res.ref;
              return t.name === res.name && t.response === undefined;
            });
            if (tool) tool.response = res.output;
          }
        }
      }
    }

    for (const tool of toolsQueue) {
      sendChunk(
        JSON.stringify({
          event: "tool",
          name: tool.name,
          arg: tool.arg,
          response: tool.response,
        }),
      );
    }

    const { text } = await response;
    return { reply: text };
  },
);
