"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TicketStatus = "open" | "in_progress" | "resolved";
type TicketPriority = "low" | "medium" | "high";
type Relation<T> = T | T[] | null;
type AdminTicket = {
  id: number;
  issue: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  order_id: number | null;
  customers: Relation<{ name: string; email: string }>;
  orders: Relation<{
    id: number;
    status: string;
    order_date: string;
    expected_delivery: string | null;
  }>;
};
type Filter = "all" | TicketStatus | "high_priority";
type EditState = { status: TicketStatus; priority: TicketPriority };

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All tickets" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "high_priority", label: "High priority" },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [edits, setEdits] = useState<Record<number, EditState>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState<{ id: number; kind: "success" | "error"; message: string } | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/tickets", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load support tickets.");
      const loaded = data.tickets as AdminTicket[];
      setTickets(loaded);
      setEdits(
        Object.fromEntries(
          loaded.map((ticket) => [ticket.id, { status: ticket.status, priority: ticket.priority }])
        )
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const counts = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    }),
    [tickets]
  );

  const visibleTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        if (filter === "high_priority") return ticket.priority === "high";
        return filter === "all" || ticket.status === filter;
      }),
    [filter, tickets]
  );

  function updateEdit(ticket: AdminTicket, field: keyof EditState, value: string) {
    setEdits((current) => ({
      ...current,
      [ticket.id]: {
        ...current[ticket.id],
        [field]: value,
      } as EditState,
    }));
    setFeedback((current) => (current?.id === ticket.id ? null : current));
  }

  async function saveTicket(ticket: AdminTicket) {
    const edit = edits[ticket.id];
    if (!edit) return;
    const updates: Partial<EditState> = {};
    if (edit.status !== ticket.status) updates.status = edit.status;
    if (edit.priority !== ticket.priority) updates.priority = edit.priority;
    if (Object.keys(updates).length === 0) {
      setFeedback({ id: ticket.id, kind: "success", message: "No changes to save." });
      return;
    }

    setSavingId(ticket.id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update this ticket.");
      setFeedback({ id: ticket.id, kind: "success", message: `Ticket #${ticket.id} saved.` });
      await loadTickets();
    } catch (error) {
      setFeedback({
        id: ticket.id,
        kind: "error",
        message: error instanceof Error ? error.message : "Could not update this ticket.",
      });
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      window.location.assign("/admin/login");
    } catch (error) {
      setFeedback({
        id: 0,
        kind: "error",
        message: error instanceof Error ? error.message : "Could not sign out. Please try again.",
      });
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3] md:flex">
      <aside className="flex shrink-0 flex-col bg-[#17182c] text-white md:sticky md:top-0 md:h-screen md:w-[248px]">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.08] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 text-base font-bold shadow-sm">C</div>
          <div>
            <p className="text-sm font-semibold">CartCare AI</p>
            <p className="text-[11px] text-slate-400">Admin Panel</p>
          </div>
        </div>
        <nav aria-label="Admin navigation" className="flex gap-2 p-3 md:block md:flex-1 md:space-y-1 md:px-4 md:py-6">
          <span className="hidden px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:block">
            Workspace
          </span>
          <div
            aria-current="page"
            className="flex items-center gap-3 rounded-xl bg-violet-500/15 px-3 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-violet-400/20"
          >
            <TicketIcon />
            Support tickets
          </div>
        </nav>
        <div className="hidden border-t border-white/[0.08] p-4 md:block">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-200 text-sm font-semibold text-violet-900">A</div>
            <div>
              <p className="text-xs font-semibold">Administrator</p>
              <p className="mt-0.5 text-[10px] text-slate-400">CartCare support</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <LogoutIcon />
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[#e9e7e2] bg-[#f7f6f3]/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div>
            <p className="text-sm font-semibold text-slate-900">Admin Panel</p>
            <p className="hidden text-[11px] text-slate-400 sm:block">Customer support operations</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="rounded-lg border border-[#e3e1dc] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-800 disabled:opacity-50 md:hidden"
          >
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
          <span className="hidden items-center gap-2 rounded-full border border-[#e9e7e2] bg-white px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-600">Admin session active</span>
          </span>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Support operations</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">Ticket management</h1>
              <p className="mt-1.5 text-sm text-slate-500">Review customer requests and keep each case moving.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadTickets()}
              disabled={loading}
              className="w-fit rounded-xl border border-[#e3e1dc] bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-800 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh tickets"}
            </button>
          </section>

          {feedback?.id === 0 && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {feedback.message}
            </p>
          )}

          <section aria-label="Ticket summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard label="Total Tickets" value={counts.total} icon="▤" tone="violet" loading={loading} />
            <SummaryCard label="Open Tickets" value={counts.open} icon="◷" tone="amber" loading={loading} />
            <SummaryCard label="In Progress" value={counts.inProgress} icon="↗" tone="blue" loading={loading} />
            <SummaryCard label="Resolved" value={counts.resolved} icon="✓" tone="green" loading={loading} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e9e7e2] bg-white shadow-[0_4px_18px_rgba(27,30,45,0.04)]">
            <div className="border-b border-slate-100 px-4 pt-4 sm:px-5">
              <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter tickets">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === item.id}
                    onClick={() => setFilter(item.id)}
                    className={`relative shrink-0 px-3 py-3 text-xs font-semibold transition ${
                      filter === item.id
                        ? "text-violet-800 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-violet-700"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loadError && (
              <div role="alert" className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>{loadError}</p>
                <button type="button" onClick={() => void loadTickets()} className="mt-2 font-semibold underline">
                  Try again
                </button>
              </div>
            )}
            {loading && <p role="status" className="px-5 py-12 text-center text-sm text-slate-500">Loading tickets from CartCare…</p>}
            {!loading && !loadError && visibleTickets.length === 0 && (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><TicketIcon /></div>
                <p className="mt-3 text-sm font-semibold text-slate-800">No tickets found</p>
                <p className="mt-1 text-xs text-slate-500">
                  {tickets.length === 0 ? "Customer tickets will appear here." : "Try another filter to see more tickets."}
                </p>
              </div>
            )}
            {!loading && !loadError && visibleTickets.length > 0 && (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1050px] table-fixed text-left">
                    <thead className="bg-[#fbfaf8] text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      <tr>
                        <th className="w-[8%] px-4 py-3">Ticket</th>
                        <th className="w-[17%] px-4 py-3">Customer</th>
                        <th className="w-[25%] px-4 py-3">Issue</th>
                        <th className="w-[8%] px-4 py-3">Order</th>
                        <th className="w-[10%] px-4 py-3">Priority</th>
                        <th className="w-[12%] px-4 py-3">Status</th>
                        <th className="w-[11%] px-4 py-3">Created</th>
                        <th className="w-[9%] px-4 py-3">Save</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleTickets.map((ticket) => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          edit={edits[ticket.id]}
                          feedback={feedback?.id === ticket.id ? feedback : null}
                          saving={savingId === ticket.id}
                          onChange={updateEdit}
                          onSave={saveTicket}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-slate-100 lg:hidden">
                  {visibleTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      edit={edits[ticket.id]}
                      feedback={feedback?.id === ticket.id ? feedback : null}
                      saving={savingId === ticket.id}
                      onChange={updateEdit}
                      onSave={saveTicket}
                    />
                  ))}
                </ul>
              </>
            )}
            {!loading && !loadError && visibleTickets.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
                Showing {visibleTickets.length} of {tickets.length} tickets
              </div>
            )}
          </section>
          <p className="text-center text-[11px] text-slate-400">CartCare AI · Administrator workspace</p>
        </div>
      </div>
    </main>
  );
}

function TicketRow({
  ticket, edit, feedback, saving, onChange, onSave,
}: {
  ticket: AdminTicket;
  edit?: EditState;
  feedback: { kind: "success" | "error"; message: string } | null;
  saving: boolean;
  onChange: (ticket: AdminTicket, field: keyof EditState, value: string) => void;
  onSave: (ticket: AdminTicket) => void;
}) {
  const customer = relationOne(ticket.customers);
  return (
    <tr className="align-top transition hover:bg-[#fcfbfa]">
      <td className="px-4 py-4 text-xs font-semibold text-slate-700">#{ticket.id}</td>
      <td className="px-4 py-4">
        <p className="truncate text-xs font-semibold text-slate-800">{customer?.name ?? "Customer"}</p>
        <p className="mt-1 break-all text-[11px] text-slate-400">{customer?.email ?? "Email unavailable"}</p>
      </td>
      <td className="px-4 py-4">
        <p className="line-clamp-3 break-words text-xs leading-5 text-slate-600">{ticket.issue}</p>
      </td>
      <td className="px-4 py-4 text-xs text-slate-600">{ticket.order_id === null ? "—" : `#${ticket.order_id}`}</td>
      <td className="px-4 py-4"><PrioritySelect value={edit?.priority ?? ticket.priority} onChange={(value) => onChange(ticket, "priority", value)} /></td>
      <td className="px-4 py-4"><StatusSelect value={edit?.status ?? ticket.status} onChange={(value) => onChange(ticket, "status", value)} /></td>
      <td className="px-4 py-4 text-[11px] text-slate-500">{formatDate(ticket.created_at)}</td>
      <td className="px-4 py-4"><SaveButton saving={saving} onClick={() => onSave(ticket)} /></td>
    </tr>
  );
}

function TicketCard({
  ticket, edit, feedback, saving, onChange, onSave,
}: {
  ticket: AdminTicket;
  edit?: EditState;
  feedback: { kind: "success" | "error"; message: string } | null;
  saving: boolean;
  onChange: (ticket: AdminTicket, field: keyof EditState, value: string) => void;
  onSave: (ticket: AdminTicket) => void;
}) {
  const customer = relationOne(ticket.customers);
  return (
    <li className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-800">Ticket #{ticket.id}</p>
          <p className="mt-1 text-xs text-slate-600">{customer?.name ?? "Customer"}</p>
          <p className="break-all text-[11px] text-slate-400">{customer?.email ?? "Email unavailable"}</p>
        </div>
        <span className="shrink-0 text-[11px] text-slate-400">{formatDate(ticket.created_at)}</span>
      </div>
      <p className="break-words text-xs leading-5 text-slate-600">{ticket.issue}</p>
      <p className="text-[11px] text-slate-500">{ticket.order_id === null ? "No linked order" : `Order #${ticket.order_id}`}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] font-medium text-slate-500">
          Priority
          <PrioritySelect value={edit?.priority ?? ticket.priority} onChange={(value) => onChange(ticket, "priority", value)} />
        </label>
        <label className="text-[10px] font-medium text-slate-500">
          Status
          <StatusSelect value={edit?.status ?? ticket.status} onChange={(value) => onChange(ticket, "status", value)} />
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        {feedback ? <FeedbackMessage feedback={feedback} /> : <span />}
        <SaveButton saving={saving} onClick={() => onSave(ticket)} />
      </div>
    </li>
  );
}

function PrioritySelect({ value, onChange }: { value: TicketPriority; onChange: (value: TicketPriority) => void }) {
  return (
    <select
      aria-label="Ticket priority"
      value={value}
      onChange={(event) => onChange(event.target.value as TicketPriority)}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  );
}

function StatusSelect({ value, onChange }: { value: TicketStatus; onChange: (value: TicketStatus) => void }) {
  return (
    <select
      aria-label="Ticket status"
      value={value}
      onChange={(event) => onChange(event.target.value as TicketStatus)}
      className={`mt-1 w-full rounded-lg border px-2 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-violet-100 ${statusSelectTone(value)}`}
    >
      <option value="open">Open</option>
      <option value="in_progress">In progress</option>
      <option value="resolved">Resolved</option>
    </select>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="rounded-lg bg-violet-700 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"
    >
      {saving ? "Saving…" : "Save"}
    </button>
  );
}

function FeedbackMessage({ feedback }: { feedback: { kind: "success" | "error"; message: string } }) {
  return (
    <span role={feedback.kind === "error" ? "alert" : "status"} className={`text-[11px] ${feedback.kind === "success" ? "text-emerald-700" : "text-rose-700"}`}>
      {feedback.message}
    </span>
  );
}

function SummaryCard({
  label, value, icon, tone, loading,
}: {
  label: string;
  value: number;
  icon: string;
  tone: "violet" | "amber" | "blue" | "green";
  loading: boolean;
}) {
  const colors = {
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <article className="rounded-2xl border border-[#e9e7e2] bg-white p-4 shadow-[0_2px_8px_rgba(27,30,45,0.03)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${colors[tone]}`} aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{loading ? "—" : value}</p>
    </article>
  );
}

function TicketIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M10 9v1M10 14v1" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-[17px] w-[17px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
    </svg>
  );
}

function relationOne<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return (relation[0] as T | undefined) ?? null;
  return relation;
}

function statusSelectTone(status: TicketStatus): string {
  if (status === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "in_progress") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
