"use client";

import { useEffect, useState } from "react";

type ProductRelation = { name: string } | { name: string }[] | null;
type CustomerReturn = {
  id: number;
  order_id: number;
  product_id: string;
  reason: string;
  status: string;
  created_at: string;
  products: ProductRelation;
};

export default function ReturnsPanel({ refreshKey }: { refreshKey: number }) {
  const [returns, setReturns] = useState<CustomerReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/returns")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load your returns.");
        if (active) setReturns(data.returns as CustomerReturn[]);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your returns.");
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
        <p className="text-sm font-semibold text-violet-700">RETURNS & REFUNDS</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">My Returns</h2>
        <p className="mt-1 text-sm text-slate-500">Review your return requests and their latest status.</p>
      </div>
      <div className="p-4 sm:p-6">
        {loading && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading your returns…</p>}
        {!loading && error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!loading && !error && returns.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">You don’t have any return requests yet.</p>
        )}
        {!loading && !error && returns.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {returns.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Return request</p>
                    <h3 className="mt-0.5 font-bold text-slate-900">#{item.id}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${returnStatusClass(item.status)}`}>
                    {formatStatus(item.status)}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                  <div><dt className="text-xs text-slate-400">Order</dt><dd className="mt-0.5 font-medium text-slate-700">#{item.order_id}</dd></div>
                  <div><dt className="text-xs text-slate-400">Created</dt><dd className="mt-0.5 font-medium text-slate-700">{formatDate(item.created_at)}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-slate-400">Product</dt><dd className="mt-0.5 font-medium text-slate-700">{getProductName(item.products) ?? item.product_id}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-slate-400">Reason</dt><dd className="mt-0.5 text-slate-700">{item.reason}</dd></div>
                </dl>
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
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function returnStatusClass(status: string): string {
  if (status === "refunded") return "bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}
