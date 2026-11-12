import "server-only";
import type { Content, Part } from "@google/genai";
import { getGemini } from "../gemini";
import { GEMINI_MODEL } from "../env";
import type { ChatMessage } from "../schemas";
import { tools } from "./tools";
import { toFunctionDeclarations } from "./defineTool";
import { buildSystemPrompt } from "./systemPrompt";
import type { AgentResult, AgentStep } from "./types";

/** Stops the agent from looping forever and using up your Gemini quota. */
const MAX_ROUNDS = 8;
const MAX_ADDITIONAL_ATTEMPTS = 2;
const INITIAL_RETRY_DELAY_MS = 250;

export class GeminiRetryExhaustedError extends Error {
  constructor(
    readonly status: 429 | 503,
    readonly originalError: unknown
  ) {
    super(status === 503 ? "Gemini is temporarily unavailable." : "Gemini is temporarily rate limited.");
    this.name = "GeminiRetryExhaustedError";
  }
}

/**
 * THE AGENT LOOP
 * 1. Send the chat + the tool list to Gemini.
 * 2. If Gemini asks for tools, check the arguments with Zod and run them.
 * 3. Send the results back to Gemini.
 * 4. Repeat until Gemini gives a final text answer (or MAX_ROUNDS is reached).
 */
export async function runAgent(messages: ChatMessage[]): Promise<AgentResult> {
  const ai = getGemini();
  const steps: AgentStep[] = [];
  const functionDeclarations = toFunctionDeclarations(tools);

  const contents: Content[] = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await generateContentWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: buildSystemPrompt(),
          tools: [{ functionDeclarations }],
          temperature: 0.2,
        },
      })
    );

    const calls = response.functionCalls ?? [];

    // No tool requested: this is the final answer.
    if (calls.length === 0) {
      return { reply: response.text?.trim() || "Sorry, I could not answer that.", steps };
    }

    // Keep Gemini's own turn (it carries the tool request) in the history.
    const modelTurn = response.candidates?.[0]?.content;
    if (modelTurn) contents.push(modelTurn);

    const responseParts: Part[] = [];
    for (const call of calls) {
      const step = await runTool(call.name ?? "", call.args ?? {});
      steps.push(step);
      responseParts.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: step.ok ? { result: step.result } : { error: step.error },
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return {
    reply: "I needed too many steps for this request. Please try a simpler or more specific question.",
    steps,
  };
}

async function generateContentWithRetry<T>(generate: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await generate();
    } catch (error) {
      const status = getTransientGeminiStatus(error);
      if (status === null) throw error;
      if (attempt >= MAX_ADDITIONAL_ATTEMPTS) {
        throw new GeminiRetryExhaustedError(status, error);
      }

      const delay = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function getTransientGeminiStatus(error: unknown): 429 | 503 | null {
  if (error && typeof error === "object") {
    const fields = error as Record<string, unknown>;
    const structuredValues = [fields.status, fields.statusCode, fields.code].filter(
      (value) => value !== undefined && value !== null
    );

    if (structuredValues.length > 0) {
      for (const value of structuredValues) {
        if (value === 503 || value === "503" || value === "UNAVAILABLE") return 503;
        if (value === 429 || value === "429" || value === "RESOURCE_EXHAUSTED") return 429;
      }
      return null;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/\b503\b|\bUNAVAILABLE\b/i.test(message)) return 503;
  if (/\b429\b|\bRESOURCE_EXHAUSTED\b/i.test(message)) return 429;
  return null;
}

async function runTool(name: string, rawArgs: unknown): Promise<AgentStep> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return { tool: name, args: rawArgs, ok: false, writes: false, error: `Unknown tool: ${name}` };
  }

  // Never trust the model's arguments: check them with Zod first.
  const parsed = tool.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ");
    return { tool: name, args: rawArgs, ok: false, writes: tool.writes, error: `Invalid arguments: ${message}` };
  }

  try {
    const result = await tool.run(parsed.data);
    return { tool: name, args: parsed.data, ok: true, writes: tool.writes, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool failed";
    return { tool: name, args: parsed.data, ok: false, writes: tool.writes, error: message };
  }
}
