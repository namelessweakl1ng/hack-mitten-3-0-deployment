"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Loader2 } from "lucide-react";

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  tier: string;
  customTier: string | null;
  sortOrder: number;
  visible: boolean;
};

const TIERS = ["TITLE", "PLATINUM", "GOLD", "SILVER", "PARTNER", "CUSTOM"];

export function SponsorManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ sponsors: Sponsor[] }>({
    queryKey: ["admin-sponsors"],
    queryFn: async () => (await fetch("/api/admin/sponsors")).json(),
  });
  const sponsors: Sponsor[] = data?.sponsors ?? [];

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ name: "", websiteUrl: "", tier: "PARTNER", customTier: "", sortOrder: sponsors.length, visible: true });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      Object.entries(draft).forEach(([k, v]) => form.append(k, String(v)));
      if (logoFile) form.append("logo", logoFile);
      const res = await fetch("/api/admin/sponsors", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setCreating(false);
      setDraft({ name: "", websiteUrl: "", tier: "PARTNER", customTier: "", sortOrder: sponsors.length + 1, visible: true });
      setLogoFile(null);
      qc.invalidateQueries({ queryKey: ["admin-sponsors"] });
      qc.invalidateQueries({ queryKey: ["sponsors"] });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const update = async (id: string, patch: Partial<Sponsor>) => {
    const form = new FormData();
    Object.entries(patch).forEach(([k, v]) => form.append(k, String(v)));
    await fetch(`/api/admin/sponsors/${id}`, { method: "PATCH", body: form });
    qc.invalidateQueries({ queryKey: ["admin-sponsors"] });
    qc.invalidateQueries({ queryKey: ["sponsors"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this sponsor?")) return;
    await fetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["admin-sponsors"] });
    qc.invalidateQueries({ queryKey: ["sponsors"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#B52A32] mb-2">/ Sponsors</div>
          <h1 className="display text-2xl md:text-3xl font-bold text-white">Sponsor Management</h1>
          <p className="text-sm text-[#A8A8A8] mt-1">{sponsors.length} sponsors across {new Set(sponsors.map(s => s.tier)).size} tiers</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-full bg-[#B52A32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D83A43] min-h-[44px]">
          <Plus size={14} /> Add Sponsor
        </button>
      </header>

      {error && <div className="glass rounded p-3 text-sm text-[#D83A43] border-l-2 border-[#B52A32]">{error}</div>}

      {creating && (
        <div className="glass rounded-lg p-5 border-l-2 border-[#B52A32]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New Sponsor</h3>
            <button onClick={() => setCreating(false)} className="text-[#A8A8A8] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Labeled label="Name"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Website URL"><input value={draft.websiteUrl} onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Tier">
              <select value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value })} className={inputCls}>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Labeled>
            <Labeled label="Custom Tier (if CUSTOM)"><input value={draft.customTier} onChange={(e) => setDraft({ ...draft, customTier: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Sort Order"><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value) || 0 })} className={inputCls} /></Labeled>
            <Labeled label="Logo (JPEG/PNG/WebP, max 8MB)"><input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="text-xs text-[#A8A8A8]" /></Labeled>
          </div>
          <button onClick={create} disabled={busy || !draft.name} className="mt-4 flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white hover:bg-[#D83A43]">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Sponsor
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="text-[#A8A8A8] text-sm">Loading…</div>
        ) : sponsors.map((s) => (
          <div key={s.id} className="glass rounded-lg p-4">
            <div className="flex items-start gap-3">
              {s.logoUrl && (
                <img src={s.logoUrl} alt={s.name} className="h-12 w-12 object-contain bg-white/5 rounded" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                <div className="mono text-[10px] uppercase tracking-widest text-[#B52A32]">{s.tier}</div>
                <div className="text-xs text-[#A8A8A8] mt-1 truncate">{s.websiteUrl || "—"}</div>
              </div>
              <button onClick={() => del(s.id)} className="text-[#A8A8A8] hover:text-[#D83A43]"><Trash2 size={14} /></button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <select value={s.tier} onChange={(e) => update(s.id, { tier: e.target.value })} className="bg-[#080808] border border-white/10 rounded px-2 py-1 text-xs text-white">
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button
                onClick={() => update(s.id, { visible: !s.visible })}
                className={`text-xs px-3 py-1 rounded ${s.visible ? "bg-[#B52A32]/20 text-[#D83A43]" : "bg-[#151515] text-[#A8A8A8]"}`}
              >
                {s.visible ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-[#080808] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-[#B52A32] focus:outline-none";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mono text-[9px] uppercase tracking-widest text-[#A8A8A8]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
