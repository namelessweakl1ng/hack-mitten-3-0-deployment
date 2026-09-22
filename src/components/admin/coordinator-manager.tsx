"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Loader2, Save, Crown, Pencil } from "lucide-react";

type Coordinator = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  type: "STUDENT" | "FACULTY";
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  isLead: boolean;
  sortOrder: number;
  visible: boolean;
};

export function CoordinatorManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ coordinators: Coordinator[] }>({
    queryKey: ["admin-coordinators"],
    queryFn: async () => (await fetch("/api/admin/coordinators")).json(),
  });
  const coordinators: Coordinator[] = data?.coordinators ?? [];

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Coordinator | null>(null);
  const [draft, setDraft] = useState<any>({
    name: "", role: "", department: "", type: "STUDENT",
    phone: "", email: "", linkedinUrl: "", githubUrl: "",
    isLead: false, sortOrder: 0, visible: true,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDraft({
      name: "", role: "", department: "", type: "STUDENT",
      phone: "", email: "", linkedinUrl: "", githubUrl: "",
      isLead: false, sortOrder: coordinators.length, visible: true,
    });
    setPhotoFile(null);
    setError(null);
  };

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      Object.entries(draft).forEach(([k, v]) => form.append(k, String(v)));
      if (photoFile) form.append("photo", photoFile);
      const res = await fetch("/api/admin/coordinators", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setCreating(false);
      reset();
      qc.invalidateQueries({ queryKey: ["admin-coordinators"] });
      qc.invalidateQueries({ queryKey: ["coordinators"] });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      Object.entries(draft).forEach(([k, v]) => form.append(k, String(v)));
      if (photoFile) form.append("photo", photoFile);
      const res = await fetch(`/api/admin/coordinators/${editing.id}`, { method: "PATCH", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setEditing(null);
      reset();
      qc.invalidateQueries({ queryKey: ["admin-coordinators"] });
      qc.invalidateQueries({ queryKey: ["coordinators"] });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this coordinator?")) return;
    await fetch(`/api/admin/coordinators/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["admin-coordinators"] });
    qc.invalidateQueries({ queryKey: ["coordinators"] });
  };

  const toggleVisible = async (c: Coordinator) => {
    const form = new FormData();
    Object.entries(c).forEach(([k, v]) => form.append(k, String(v ?? "")));
    form.set("visible", String(!c.visible));
    await fetch(`/api/admin/coordinators/${c.id}`, { method: "PATCH", body: form });
    qc.invalidateQueries({ queryKey: ["admin-coordinators"] });
    qc.invalidateQueries({ queryKey: ["coordinators"] });
  };

  const students = coordinators.filter((c) => c.type === "STUDENT");
  const faculty = coordinators.filter((c) => c.type === "FACULTY");

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#B52A32] mb-2">/ Coordinators</div>
          <h1 className="display text-2xl md:text-3xl font-bold text-white">Coordinator Management</h1>
          <p className="text-sm text-[#A8A8A8] mt-1">{coordinators.length} coordinators · {students.length} student + {faculty.length} faculty</p>
        </div>
        <button
          onClick={() => { reset(); setCreating(true); }}
          className="flex items-center gap-2 rounded-full bg-[#B52A32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D83A43] min-h-[44px]"
        >
          <Plus size={14} /> Add Coordinator
        </button>
      </header>

      {error && <div className="glass rounded p-3 text-sm text-[#D83A43] border-l-2 border-[#B52A32]">{error}</div>}

      {(creating || editing) && (
        <div className="glass rounded-lg p-5 border-l-2 border-[#B52A32]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{editing ? "Edit Coordinator" : "New Coordinator"}</h3>
            <button
              onClick={() => { setCreating(false); setEditing(null); reset(); }}
              className="text-[#A8A8A8] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Labeled label="Full Name"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} placeholder="Enter full name" /></Labeled>
            <Labeled label="Role"><input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className={inputCls} placeholder="e.g. Lead Organizer" /></Labeled>
            <Labeled label="Department"><input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} className={inputCls} placeholder="e.g. Computer Science" /></Labeled>
            <Labeled label="Type">
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className={inputCls}>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
              </select>
            </Labeled>
            <Labeled label="Phone (optional)"><input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputCls} placeholder="Enter phone" /></Labeled>
            <Labeled label="Email (optional)"><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputCls} placeholder="Enter email" /></Labeled>
            <Labeled label="Sort Order"><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value) || 0 })} className={inputCls} /></Labeled>
            <Labeled label="Photo (JPEG/PNG/WebP, max 8MB)"><input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="text-xs text-[#A8A8A8]" /></Labeled>
          </div>
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, isLead: !draft.isLead })}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded ${draft.isLead ? "bg-[#B52A32] text-white" : "border border-white/15 text-[#A8A8A8]"}`}
              >
                <Crown size={12} /> Lead
              </button>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, visible: !draft.visible })}
                className={`text-xs px-3 py-1.5 rounded ${draft.visible ? "bg-[#B52A32]/20 text-[#D83A43]" : "bg-[#151515] text-[#A8A8A8]"}`}
              >
                {draft.visible ? "Visible" : "Hidden"}
              </button>
            </label>
          </div>
          <button
            onClick={editing ? saveEdit : create}
            disabled={busy || !draft.name}
            className="mt-4 flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white hover:bg-[#D83A43]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editing ? "Save Changes" : "Create Coordinator"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-[#A8A8A8] text-sm">Loading…</div>
      ) : coordinators.length === 0 ? (
        <div className="glass rounded-lg p-8 text-center">
          <div className="text-[#A8A8A8] text-sm mb-2">No coordinators added yet.</div>
          <div className="text-xs text-[#A8A8A8]/70">Click “Add Coordinator” to create the first one.</div>
        </div>
      ) : (
        <div className="space-y-6">
          <CoordinatorGroup title="STUDENT COORDINATORS" coordinators={students} onEdit={(c) => { setEditing(c); setDraft({ ...c }); setPhotoFile(null); }} onDelete={del} onToggleVisible={toggleVisible} />
          <CoordinatorGroup title="FACULTY COORDINATORS" coordinators={faculty} onEdit={(c) => { setEditing(c); setDraft({ ...c }); setPhotoFile(null); }} onDelete={del} onToggleVisible={toggleVisible} />
        </div>
      )}
    </div>
  );
}

function CoordinatorGroup({
  title, coordinators, onEdit, onDelete, onToggleVisible,
}: {
  title: string;
  coordinators: Coordinator[];
  onEdit: (c: Coordinator) => void;
  onDelete: (id: string) => void;
  onToggleVisible: (c: Coordinator) => void;
}) {
  if (coordinators.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">{title}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {coordinators.map((c) => (
          <div key={c.id} className="glass rounded-lg p-4">
            <div className="flex items-start gap-3">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={c.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-[#151515] flex items-center justify-center text-[#B52A32] mono text-sm">
                  {c.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                  {c.isLead && <Crown size={12} className="text-[#D83A43] shrink-0" />}
                </div>
                <div className="text-xs text-[#B52A32]">{c.role}</div>
                {c.department && <div className="text-xs text-[#A8A8A8] mt-0.5">{c.department}</div>}
                {c.email && <div className="text-xs text-[#A8A8A8] mt-1 truncate">{c.email}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => onEdit(c)} className="text-[#A8A8A8] hover:text-white" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(c.id)} className="text-[#A8A8A8] hover:text-[#D83A43]" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <button
                onClick={() => onToggleVisible(c)}
                className={`text-xs px-3 py-1 rounded ${c.visible ? "bg-[#B52A32]/20 text-[#D83A43]" : "bg-[#151515] text-[#A8A8A8]"}`}
              >
                {c.visible ? "Visible" : "Hidden"}
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
