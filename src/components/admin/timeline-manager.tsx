"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, X, Loader2 } from "lucide-react";

type Phase = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  sortOrder: number;
  visible: boolean;
};

export function TimelineManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ phases: Phase[] }>({
    queryKey: ["admin-phases"],
    queryFn: async () => (await fetch("/api/admin/phases")).json(),
  });
  const phases: Phase[] = data?.phases ?? [];

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Phase>>({ name: "", description: "", startDate: new Date().toISOString().slice(0, 10), startTime: "09:00", endDate: "", endTime: "10:00", sortOrder: phases.length, visible: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/admin/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setCreating(false);
      setDraft({ name: "", description: "", startDate: new Date().toISOString().slice(0, 10), startTime: "09:00", endDate: "", endTime: "10:00", sortOrder: phases.length + 1, visible: true });
      qc.invalidateQueries({ queryKey: ["admin-phases"] });
      qc.invalidateQueries({ queryKey: ["phases"] });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const updatePhase = async (id: string, patch: Partial<Phase>) => {
    await fetch(`/api/admin/phases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    qc.invalidateQueries({ queryKey: ["admin-phases"] });
    qc.invalidateQueries({ queryKey: ["phases"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this phase?")) return;
    await fetch(`/api/admin/phases/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["admin-phases"] });
    qc.invalidateQueries({ queryKey: ["phases"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#B52A32] mb-2">/ Timeline</div>
          <h1 className="display text-2xl md:text-3xl font-bold text-white">Hackathon Phases</h1>
          <p className="text-sm text-[#A8A8A8] mt-1">{phases.length} phases — drag reorder via sort order field</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-full bg-[#B52A32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D83A43] transition-all min-h-[44px]"
        >
          <Plus size={14} /> Add Phase
        </button>
      </header>

      {error && <div className="glass rounded p-3 text-sm text-[#D83A43] border-l-2 border-[#B52A32]">{error}</div>}

      {creating && (
        <div className="glass rounded-lg p-5 border-l-2 border-[#B52A32]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New Phase</h3>
            <button onClick={() => setCreating(false)} className="text-[#A8A8A8] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Name" value={draft.name || ""} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Input label="Description" value={draft.description || ""} onChange={(v) => setDraft({ ...draft, description: v })} />
            <Input label="Start Date" type="date" value={draft.startDate || ""} onChange={(v) => setDraft({ ...draft, startDate: v })} />
            <Input label="Start Time" type="time" value={draft.startTime || ""} onChange={(v) => setDraft({ ...draft, startTime: v })} />
            <Input label="End Date" type="date" value={draft.endDate || ""} onChange={(v) => setDraft({ ...draft, endDate: v })} />
            <Input label="End Time" type="time" value={draft.endTime || ""} onChange={(v) => setDraft({ ...draft, endTime: v })} />
            <Input label="Sort Order" type="number" value={String(draft.sortOrder ?? 0)} onChange={(v) => setDraft({ ...draft, sortOrder: parseInt(v) || 0 })} />
          </div>
          <button
            onClick={create}
            disabled={busy || !draft.name}
            className="mt-4 flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white hover:bg-[#D83A43]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Create Phase
          </button>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-[#A8A8A8] text-sm">Loading…</div>
        ) : phases.map((p, i) => (
          <div key={p.id} className="glass rounded-lg p-4 flex items-center gap-4">
            <div className="mono text-xs text-[#B52A32] w-8">{String(i + 1).padStart(2, "0")}</div>
            <div className="flex-1 grid gap-3 md:grid-cols-3">
              <Input label="Name" value={p.name} onChange={(v) => updatePhase(p.id, { name: v })} />
              <Input label="Start" type="datetime-local" value={`${p.startDate}T${p.startTime}`} onChange={(v) => {
                const [d, t] = v.split("T");
                updatePhase(p.id, { startDate: d, startTime: t });
              }} />
              <Input label="End" type="datetime-local" value={p.endDate ? `${p.endDate}T${p.endTime || "00:00"}` : ""} onChange={(v) => {
                if (!v) return;
                const [d, t] = v.split("T");
                updatePhase(p.id, { endDate: d, endTime: t });
              }} />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => updatePhase(p.id, { visible: !p.visible })}
                className={`text-xs px-3 py-1 rounded ${p.visible ? "bg-[#B52A32]/20 text-[#D83A43]" : "bg-[#151515] text-[#A8A8A8]"}`}
              >
                {p.visible ? "Visible" : "Hidden"}
              </button>
              <button onClick={() => del(p.id)} className="text-[#A8A8A8] hover:text-[#D83A43] p-1" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mono text-[9px] uppercase tracking-widest text-[#A8A8A8]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-[#080808] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-[#B52A32] focus:outline-none"
      />
    </label>
  );
}
