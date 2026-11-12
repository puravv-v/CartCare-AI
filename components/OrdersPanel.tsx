"use client";

import { useEffect, useState } from "react";

type ProductRelation = { name: string } | { name: string }[] | null;
type OrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  products: ProductRelation;
};
type Order = {
  id: number;
  order_date: string;
  status: string;
  expected_delivery: string | null;
  total_amount: number;
  courier: string | null;
  tracking_number: string | null;
  order_items: OrderItem[];
};

export default function OrdersPanel({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/orders")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load your orders.");
        if (active) setOrders(data.orders as Order[]);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <div className="rounded-2xl border border-[#e9e7e2] bg-white shadow-[0_8px_28px_rgba(27,30,45,0.05)]">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <p className="text-sm font-semibold text-violet-700">YOUR ACCOUNT</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">My Orders</h2>
        <p className="mt-1 text-sm text-slate-500">Recent orders and their delivery details.</p>
      </div>
      <div className="p-4 sm:p-6">
        {loading && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading your orders…</p>}
        {!loading && error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">You don’t have any orders yet.</p>
        )}
        {!loading && !error && orders.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <li key={order.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Order</p>
                    <h3 className="mt-0.5 font-bold text-slate-900">#{order.id}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                  <div><dt className="text-xs text-slate-400">Order date</dt><dd className="mt-0.5 font-medium text-slate-700">{formatDate(order.order_date)}</dd></div>
                  <div><dt className="text-xs text-slate-400">Total</dt><dd className="mt-0.5 font-semibold text-slate-900">{formatMoney(order.total_amount)}</dd></div>
                  <div><dt className="text-xs text-slate-400">Expected delivery</dt><dd className="mt-0.5 font-medium text-slate-700">{order.expected_delivery ? formatDate(order.expected_delivery) : "Not available"}</dd></div>
                  <div><dt className="text-xs text-slate-400">Courier</dt><dd className="mt-0.5 font-medium text-slate-700">{order.courier ?? "Not assigned"}</dd></div>
                </dl>
                {order.tracking_number && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Tracking number <span className="break-all font-mono font-semibold text-slate-800">{order.tracking_number}</span>
                  </p>
                )}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Items</p>
                  <ul className="mt-2 space-y-1.5">
                    {order.order_items.map((item, index) => (
                      <li key={`${item.product_id}-${index}`} className="flex justify-between gap-3 text-sm text-slate-700">
                        <span className="min-w-0 break-words">{getProductName(item.products) ?? item.product_id} <span className="text-slate-400">× {item.quantity}</span></span>
                        <span className="shrink-0 text-slate-500">{formatMoney(item.unit_price)}</span>
                      </li>
                    ))}
                    {order.order_items.length === 0 && <li className="text-sm text-slate-500">No item details available.</li>}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function getProductName(relation: ProductRelation): string | null {
  const product = Array.isArray(relation) ? relation[0] : relation;
  return product?.name ?? null;
}

function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string): string {
  if (status === "delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  return "bg-violet-50 text-violet-700";
}
