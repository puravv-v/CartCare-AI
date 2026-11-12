"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";

type Message = { role: "user" | "model"; text: string; steps?: AgentStep[] };

const SAMPLE_PROMPTS = [
  "Where is my order 1003?",
  "I want to return the shoes from my last order, they are too small.",
  "My order is 4 days late and nobody is answering.",
];

export default function AgentChat({ onDataChanged }: { onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reach CartCare support.");
      const result = data as AgentResult;
      setMessages([...next, { role: "model", text: result.reply, steps: result.steps }]);
      if (result.steps.some((step) => step.writes && step.ok)) onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex h-[min(72vh,760px)] min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e9e7e2] bg-white shadow-[0_8px_28px_rgba(27,30,45,0.05)]">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-700">✦</div>
          <div>
            <h2 className="font-semibold text-slate-900">Support Chat</h2>
            <p className="text-xs text-slate-500">CartCare AI · Here to help with your shopping</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Ready to help
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#faf9f7] p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="max-w-xl">
              <div className="mb-5 max-w-[90%] rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                Hi! I’m CartCare AI. I can help track your order, check a return, or get a support specialist involved. What can I help you with?
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested questions</p>
              <div className="space-y-2">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    disabled={loading}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[90%] space-y-2 sm:max-w-[80%]">
                {message.steps && message.steps.length > 0 && <ToolSteps steps={message.steps} />}
                <div
                  className={
                    message.role === "user"
                      ? "min-w-0 max-w-full break-words rounded-2xl rounded-tr-sm bg-violet-700 px-4 py-3 text-sm leading-6 text-white [overflow-wrap:anywhere]"
                      : "min-w-0 max-w-full break-words rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm [overflow-wrap:anywhere]"
                  }
                >
                  {message.role === "model" ? (
                    <MarkdownMessage text={message.text} />
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <p role="status" className="text-sm text-slate-500">
              CartCare AI is checking that for you…
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-slate-100 bg-white p-3 sm:p-4"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about an order, return, or issue…"
            aria-label="Message CartCare AI"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
        <h3 className="font-semibold text-slate-900">How I can help</h3>
        <ul className="mt-4 space-y-4 text-sm text-slate-600">
          <li><span className="mr-2 text-violet-700">✓</span>Track deliveries and order details</li>
          <li><span className="mr-2 text-violet-700">✓</span>Check return eligibility and request returns</li>
          <li><span className="mr-2 text-violet-700">✓</span>Connect you with human support</li>
        </ul>
        <p className="mt-6 rounded-xl bg-violet-50 p-4 text-xs leading-5 text-violet-900">
          Your order details are looked up securely so answers are based on your account.
        </p>
      </aside>
    </div>
  );
}

function MarkdownMessage({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index++;
      continue;
    }

    const firstListItem = getListItem(lines[index]);
    if (firstListItem) {
      const listItems: string[] = [];
      const ordered = firstListItem.ordered;
      while (index < lines.length) {
        const item = getListItem(lines[index]);
        if (!item || item.ordered !== ordered) break;
        listItems.push(item.text);
        index++;
      }

      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List
          key={`list-${index}`}
          className={`my-2 space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-1">
              {renderInlineMarkdown(item, `list-${index}-${itemIndex}`)}
            </li>
          ))}
        </List>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !getListItem(lines[index])) {
      paragraph.push(lines[index].trim());
      index++;
    }
    blocks.push(
      <p key={`paragraph-${index}`} className="my-1.5 first:mt-0 last:mb-0">
        {renderInlineMarkdown(paragraph.join(" "), `paragraph-${index}`)}
      </p>
    );
  }

  return <div className="space-y-2">{blocks}</div>;
}

function getListItem(line: string): { ordered: boolean; text: string } | null {
  const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
  if (bullet) return { ordered: false, text: bullet[1] };
  const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
  if (numbered) return { ordered: true, text: numbered[1] };
  return null;
}

function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  const tokenPattern = /\*\*([^*\n]+)\*\*|__([^_\n]+)__|`([^`\n]+)`|\*([^*\n]+)\*|(?<![\w])_([^_\n]+)_(?![\w])/g;
  const nodes: React.ReactNode[] = [];
  let previousIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > previousIndex) {
      nodes.push(text.slice(previousIndex, matchIndex));
    }

    const key = `${keyPrefix}-${matchIndex}`;
    if (match[1] !== undefined || match[2] !== undefined) {
      nodes.push(<strong key={key}>{match[1] ?? match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] break-all"
        >
          {match[3]}
        </code>
      );
    } else {
      nodes.push(<em key={key}>{match[4] ?? match[5]}</em>);
    }
    previousIndex = matchIndex + match[0].length;
  }

  if (previousIndex < text.length) nodes.push(text.slice(previousIndex));
  return nodes;
}

function ToolSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="max-w-full space-y-1.5">
      {steps.map((step, index) => (
        <details
          key={index}
          open={!step.ok}
          className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
        >
          <summary className="cursor-pointer select-none text-slate-600">
            <span className={step.ok ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
              {step.ok ? "Completed" : "Could not complete"}
            </span>
            {" · "}
            <span className="font-mono break-all">{step.tool}</span>
            {step.writes && <span className="ml-2 text-amber-700">updated account</span>}
          </summary>
          <p className="mt-2 break-words leading-5 text-slate-600 [overflow-wrap:anywhere]">
            {getToolActivityDetail(step)}
          </p>
        </details>
      ))}
    </div>
  );
}

function getToolActivityDetail(step: AgentStep): string {
  if (!step.ok) return step.error || "The tool could not complete this request.";

  const result =
    step.result && typeof step.result === "object"
      ? (step.result as Record<string, unknown>)
      : null;
  if (!result) return "Completed successfully.";

  if (step.tool === "getMyOrders" && typeof result.count === "number") {
    return `Retrieved ${result.count} recent order${result.count === 1 ? "" : "s"}.`;
  }
  if (step.tool === "getOrderDetails" && typeof result.id === "number") {
    return `Retrieved order #${result.id}${typeof result.status === "string" ? ` · ${result.status.replaceAll("_", " ")}` : ""}.`;
  }
  if (step.tool === "checkReturnEligibility" && typeof result.eligible === "boolean") {
    return typeof result.reason === "string"
      ? result.reason
      : result.eligible
        ? "This product is eligible for return."
        : "This product is not eligible for return.";
  }
  if (step.tool === "createReturnRequest" || step.tool === "escalateToHuman") {
    const created = result.created;
    if (created && typeof created === "object") {
      const record = created as Record<string, unknown>;
      const kind = step.tool === "createReturnRequest" ? "Return request" : "Support ticket";
      const id = typeof record.id === "number" ? ` #${record.id}` : "";
      const status = typeof record.status === "string" ? ` · ${record.status.replaceAll("_", " ")}` : "";
      return `${kind}${id} created${status}.`;
    }
    return "Action completed successfully.";
  }

  return "Information retrieved successfully.";
}
