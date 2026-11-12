"use client";

import { useEffect, useState } from "react";

type ProductRelation = { name: string } | { name: string }[] | null;
type OrderItem = { product_id: string; quantity: number; products: ProductRelation };
type Order = {
  id: number;
  order_date: string;
  status: string;
  expected_delivery: string | null;
  total_amount: number;
  order_items: OrderItem[];
};
type CustomerReturn = {
  id: number;
  order_id: number;
  product_id: string;
  reason: string;
  status: string;
  created_at: string;
  products: ProductRelation;
};
type Ticket = { id: number; status: string };
type OverviewData = {
  orders: Order[];
  activeOrdersCount: number;
  returns: CustomerReturn[];
  tickets: Ticket[];
};

const QUICK_ACTIONS = [
  { section: "chat", title: "Talk to support", detail: "Get help from CartCare AI", icon: "✦" },
  { section: "orders", title: "View my orders", detail: "Track a recent delivery", icon: "↗" },
  { section: "returns", title: "Check my returns", detail: "See return request updates", icon: "↺" },
] as const;

export default function OverviewDashboard({
  refreshKey,
  onNavigate,
}: {
  refreshKey: number;
  onNavigate: (section: "chat" | "orders" | "returns") => void;
}) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      fetch("/api/orders").then((response) => readResponse<{ orders: Order[]; summary: { activeOrdersCount: number } }>(response)),
      fetch("/api/returns").then((response) => readResponse<{ returns: CustomerReturn[] }>(response)),
      fetch("/api/support-tickets").then((response) => readResponse<{ tickets: Ticket[] }>(response)),
    ])
      .then(([ordersResult, returnsResult, ticketsResult]) => {
        if (!active) return;
        setData({
          orders: ordersResult.orders,
          activeOrdersCount: ordersResult.summary.activeOrdersCount,
          returns: returnsResult.returns,
          tickets: ticketsResult.tickets,
        });
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your account overview.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const metrics = [
    { label: "Recent Orders", value: data?.orders.length, caption: "Latest 10 orders", icon: "▤", tint: "bg-violet-50 text-violet-700" },
    { label: "Active Orders", value: data?.activeOrdersCount, caption: "Placed, shipped or out for delivery", icon: "◷", tint: "bg-sky-50 text-sky-700" },
    { label: "Return Requests", value: data?.returns.length, caption: "All submitted return requests", icon: "↺", tint: "bg-amber-50 text-amber-700" },
    { label: "Open Support Tickets", value: data?.tickets.filter((ticket) => ticket.status === "open").length, caption: "Waiting for support", icon: "♡", tint: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-violet-700">YOUR CARTCARE OVERVIEW</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            Good morning, Priya
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Your shopping support, order updates, and returns — all in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("chat")}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800"
        >
          <span aria-hidden="true">✦</span> Chat with support
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-[#e9e7e2] bg-white p-5 shadow-[0_2px_8px_rgba(27,30,45,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(27,30,45,0.07)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  {loading ? <span className="text-slate-300">—</span> : error ? "—" : metric.value ?? 0}
                </p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${metric.tint}`} aria-hidden="true">
                {metric.icon}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400">{metric.caption}</p>
          </article>
        ))}
      </section>

      <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.section}
            type="button"
            onClick={() => onNavigate(action.section)}
            className="group flex items-center gap-3 rounded-2xl border border-[#e9e7e2] bg-white p-4 text-left shadow-[0_2px_8px_rgba(27,30,45,0.03)] transition hover:border-violet-200 hover:shadow-[0_8px_20px_rgba(27,30,45,0.06)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-700 transition group-hover:bg-violet-100" aria-hidden="true">
              {action.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">{action.title}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{action.detail}</span>
            </span>
            <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" aria-hidden="true">→</span>
          </button>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#e9e7e2] bg-white shadow-[0_2px_8px_rgba(27,30,45,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
              <p className="mt-0.5 text-xs text-slate-500">Your latest order activity</p>
            </div>
            <button type="button" onClick={() => onNavigate("orders")} className="text-sm font-semibold text-violet-700 hover:text-violet-900">
              View all <span aria-hidden="true">→</span>
            </button>
          </div>
          {loading && <PanelMessage>Loading recent orders…</PanelMessage>}
          {!loading && !error && data?.orders.length === 0 && <PanelMessage>No orders to show yet.</PanelMessage>}
          {!loading && !error && data && data.orders.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {data.orders.slice(0, 5).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#fcfbfa]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">Order #{order.id}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {order.order_items.map((item) => getProductName(item.products) ?? item.product_id).join(", ") || "Items unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(order.order_date)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={order.status} />
                    <p className="mt-1.5 text-sm font-semibold text-slate-800">{formatMoney(order.total_amount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e9e7e2] bg-white shadow-[0_2px_8px_rgba(27,30,45,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Returns</h2>
              <p className="mt-0.5 text-xs text-slate-500">Updates on your return requests</p>
            </div>
            <button type="button" onClick={() => onNavigate("returns")} className="text-sm font-semibold text-violet-700 hover:text-violet-900">
              View all <span aria-hidden="true">→</span>
            </button>
          </div>
          {loading && <PanelMessage>Loading recent returns…</PanelMessage>}
          {!loading && !error && data?.returns.length === 0 && <PanelMessage>No return requests yet.</PanelMessage>}
          {!loading && !error && data && data.returns.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {data.returns.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{getProductName(item.products) ?? item.product_id}</p>
                    <p className="mt-1 text-xs text-slate-500">Return #{item.id} · Order #{item.order_id}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(item.created_at)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-center text-xs text-slate-400">
        Recent Orders shows up to 10 latest orders, not lifetime order history.
      </p>
    </div>
  );
}

function PanelMessage({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-500">{children}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "delivered" || status === "refunded" || status === "resolved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "cancelled" || status === "rejected"
        ? "bg-rose-50 text-rose-700"
        : status === "open"
          ? "bg-violet-50 text-violet-700"
          : "bg-amber-50 text-amber-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Could not load account data.");
  return data as T;
}

function getProductName(relation: ProductRelation): string | null {
  const product = Array.isArray(relation) ? relation[0] : relation;
  return product?.name ?? null;
}

function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
