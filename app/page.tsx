"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import OrdersPanel from "@/components/OrdersPanel";
import OverviewDashboard from "@/components/OverviewDashboard";
import ReturnsPanel from "@/components/ReturnsPanel";
import SupportTicketsPanel from "@/components/SupportTicketsPanel";

type Section = "overview" | "chat" | "orders" | "returns" | "tickets";

const navigation: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "chat", label: "Support Chat", icon: "chat" },
  { id: "orders", label: "My Orders", icon: "orders" },
  { id: "returns", label: "My Returns", icon: "returns" },
  { id: "tickets", label: "My Support Tickets", icon: "tickets" },
];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigate(section: Section) {
    setActiveSection(section);
    setMobileMenuOpen(false);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3]">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/45 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-[#17182c] text-white shadow-xl transition-transform duration-200 md:w-[76px] md:translate-x-0 xl:w-[264px] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.08] px-5 md:justify-center md:px-0 xl:justify-start xl:px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-base font-bold text-white shadow-lg shadow-violet-950/30">
            C
          </div>
          <div className="md:hidden xl:block">
            <p className="text-[15px] font-semibold tracking-tight">CartCare AI</p>
            <p className="text-[11px] text-slate-400">Customer care, made simple</p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-6 md:px-2 xl:px-3">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:hidden xl:block">
            Workspace
          </p>
          {navigation.map((item) => {
            const selected = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-current={selected ? "page" : undefined}
                onClick={() => navigate(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors md:justify-center md:px-0 xl:justify-start xl:px-3 ${
                  selected
                    ? "bg-violet-500/15 text-white ring-1 ring-inset ring-violet-400/20"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <NavIcon icon={item.icon} active={selected} />
                <span className="md:hidden xl:block">{item.label}</span>
                {item.id === "chat" && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 md:hidden xl:block" aria-label="Available" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.08] p-3 md:px-2 xl:p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5 md:justify-center md:p-1.5 xl:justify-start xl:p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8c6b5] text-xs font-bold text-[#3d302a]">
              PR
            </div>
            <div className="min-w-0 md:hidden xl:block">
              <p className="truncate text-xs font-semibold text-white">Priya Raman</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Customer ID · C001</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white md:justify-center md:px-0 xl:justify-start xl:px-3"
          >
            <NavIcon icon="logout" />
            <span className="md:hidden xl:block">Log out</span>
          </button>
        </div>
      </aside>

      <div className="min-h-screen md:ml-[76px] xl:ml-[264px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e9e7e2] bg-[#f7f6f3]/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3e1dc] bg-white text-slate-700 md:hidden"
            >
              <NavIcon icon="menu" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {navigation.find((item) => item.id === activeSection)?.label}
              </p>
              <p className="hidden text-[11px] text-slate-400 sm:block">Your personal shopping support assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#e9e7e2] bg-white px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-600">Support online</span>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          <section hidden={activeSection !== "overview"}>
            <OverviewDashboard
              refreshKey={refreshKey}
              onNavigate={(section) => navigate(section)}
            />
          </section>
          <section hidden={activeSection !== "chat"}>
            <AgentChat onDataChanged={() => setRefreshKey((key) => key + 1)} />
          </section>
          <section hidden={activeSection !== "orders"}>
            <OrdersPanel refreshKey={refreshKey} />
          </section>
          <section hidden={activeSection !== "returns"}>
            <ReturnsPanel refreshKey={refreshKey} />
          </section>
          <section hidden={activeSection !== "tickets"}>
            <SupportTicketsPanel refreshKey={refreshKey} />
          </section>
        </div>
      </div>
    </main>
  );
}

function NavIcon({ icon, active = false }: { icon: string; active?: boolean }) {
  const shared = {
    className: `h-[18px] w-[18px] shrink-0 ${active ? "text-violet-300" : "text-current"}`,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  let shape: React.ReactNode;
  switch (icon) {
    case "grid":
      shape = <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>;
      break;
    case "chat":
      shape = <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6a7.5 7.5 0 1 1 17-3.5Z" /><path d="M8 11h8M8 14h5" /></>;
      break;
    case "orders":
      shape = <><path d="M5 4.5h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>;
      break;
    case "returns":
      shape = <><path d="M4 10a8 8 0 1 1 1.7 7.6" /><path d="M4 4.5v5.7h5.7" /><path d="M12 7v5l3 2" /></>;
      break;
    case "tickets":
      shape = <><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z" /><path d="M10 9v1M10 14v1" /></>;
      break;
    case "logout":
      shape = <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>;
      break;
    case "menu":
      shape = <><path d="M4 7h16M4 12h16M4 17h16" /></>;
      break;
    default:
      shape = <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>;
  }

  return <svg {...shared}>{shape}</svg>;
}
