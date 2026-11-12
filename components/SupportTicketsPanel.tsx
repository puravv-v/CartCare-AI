"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: number;
  order_id: number | null;
  issue: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  created_at: string;
};

export default function SupportTicketsPanel({ refreshKey }: { refreshKey: number }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/support-tickets")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load your support tickets.");
        if (active) setTickets(data.tickets as Ticket[]);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your support tickets.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e9e7e2] bg-white shadow-[0_2px_8px_rgba(27,30,45,0.03)]">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold tracking-wide text-violet-700">CUSTOMER CARE</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">My Support Tickets</h1>
        <p className="mt-1 text-sm text-slate-500">Follow up on requests shared with our support team.</p>
      </div>
      <div className="p-4 sm:p-6">
        {loading && <p role="status" className="py-10 text-center text-sm text-slate-500">Loading your tickets…</p>}
        {!loading && error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        {!loading && !error && tickets.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">You don’t have any support tickets yet.</p>
        )}
        {!loading && !error && tickets.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">Ticket #{ticket.id}</h2>
                    {ticket.order_id !== null && <span className="text-xs text-slate-400">Order #{ticket.order_id}</span>}
                  </div>
                  <p className="mt-2 break-words text-sm leading-6 text-slate-600">{ticket.issue}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(ticket.created_at)} · {ticket.priority} priority</p>
                </div>
                <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(ticket.status)}`}>
                  {ticket.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function statusTone(status: Ticket["status"]): string {
  if (status === "resolved") return "bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "bg-sky-50 text-sky-700";
  return "bg-violet-50 text-violet-700";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
