"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Loader2 } from "lucide-react";

type Winner = {
  id: string;
  position: number;
  positionLabel: string;
  teamName: string;
  prize: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  visible: boolean;
};

export function WinnerManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ winners: Winner[] }>({
    queryKey: ["admin-winners"],
    queryFn: async () => (await fetch("/api/admin/winners")).json(),
  });
  const winners: Winner[] = data?.winners ?? [];

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ position: 1, positionLabel: "1st Place", teamName: "", prize: "", description: "", sortOrder: winners.length, visible: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      Object.entries(draft).forEach(([k, v]) => form.append(k, String(v)));
      if (imageFile) form.append("image", imageFile);
      const res = await fetch("/api/admin/winners", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setCreating(false);
      setDraft({ position: winners.length + 1, positionLabel: "1st Place", teamName: "", prize: "", description: "", sortOrder: winners.length + 1, visible: true });
      setImageFile(null);
      qc.invalidateQueries({ queryKey: ["admin-winners"] });
      qc.invalidateQueries({ queryKey: ["winners"] });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const update = async (id: string, patch: Partial<Winner>) => {
    const form = new FormData();
    Object.entries(patch).forEach(([k, v]) => form.append(k, String(v)));
    await fetch(`/api/admin/winners/${id}`, { method: "PATCH", body: form });
    qc.invalidateQueries({ queryKey: ["admin-winners"] });
    qc.invalidateQueries({ queryKey: ["winners"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this winner?")) return;
    await fetch(`/api/admin/winners/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["admin-winners"] });
    qc.invalidateQueries({ queryKey: ["winners"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#B52A32] mb-2">/ Winners</div>
          <h1 className="display text-2xl md:text-3xl font-bold text-white">Winner Management</h1>
          <p className="text-sm text-[#A8A8A8] mt-1">{winners.length} winners · toggle “Show Winners” in Event Settings to display publicly</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-full bg-[#B52A32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D83A43] min-h-[44px]">
          <Plus size={14} /> Add Winner
        </button>
      </header>

      {error && <div className="glass rounded p-3 text-sm text-[#D83A43] border-l-2 border-[#B52A32]">{error}</div>}

      {creating && (
        <div className="glass rounded-lg p-5 border-l-2 border-[#B52A32]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New Winner</h3>
            <button onClick={() => setCreating(false)} className="text-[#A8A8A8] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Labeled label="Position (1, 2, 3, 0=special)"><input type="number" value={draft.position} onChange={(e) => setDraft({ ...draft, position: parseInt(e.target.value) || 0 })} className={inputCls} /></Labeled>
            <Labeled label="Position Label"><input value={draft.positionLabel} onChange={(e) => setDraft({ ...draft, positionLabel: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Team Name"><input value={draft.teamName} onChange={(e) => setDraft({ ...draft, teamName: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Prize"><input value={draft.prize} onChange={(e) => setDraft({ ...draft, prize: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Description"><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className={inputCls} /></Labeled>
            <Labeled label="Winner Image (JPEG/PNG/WebP, max 8MB)"><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="text-xs text-[#A8A8A8]" /></Labeled>
          </div>
          <button onClick={create} disabled={busy || !draft.teamName} className="mt-4 flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white hover:bg-[#D83A43]">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Winner
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="text-[#A8A8A8] text-sm">Loading…</div>
        ) : winners.map((w) => (
          <div key={w.id} className="glass rounded-lg p-4">
            <div className="flex items-start gap-3">
              {w.imageUrl ? (
                <img src={w.imageUrl} alt={w.teamName} className="h-16 w-16 object-cover rounded" />
              ) : (
                <div className="h-16 w-16 bg-[#151515] rounded flex items-center justify-center text-[#B52A32] mono">{w.position}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{w.teamName}</div>
                <div className="mono text-[10px] uppercase tracking-widest text-[#B52A32]">{w.positionLabel}</div>
                {w.prize && <div className="text-xs text-[#A8A8A8] mt-1">{w.prize}</div>}
                {w.description && <div className="text-xs text-[#A8A8A8] mt-1 line-clamp-2">{w.description}</div>}
              </div>
              <button onClick={() => del(w.id)} className="text-[#A8A8A8] hover:text-[#D83A43]"><Trash2 size={14} /></button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <input
                value={w.positionLabel}
                onChange={(e) => update(w.id, { positionLabel: e.target.value })}
                className="bg-[#080808] border border-white/10 rounded px-2 py-1 text-xs text-white flex-1"
              />
              <button
                onClick={() => update(w.id, { visible: !w.visible })}
                className={`text-xs px-3 py-1 rounded ${w.visible ? "bg-[#B52A32]/20 text-[#D83A43]" : "bg-[#151515] text-[#A8A8A8]"}`}
              >
                {w.visible ? "Visible" : "Hidden"}
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
