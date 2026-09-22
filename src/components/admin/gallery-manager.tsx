"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, Loader2, RefreshCw } from "lucide-react";

type GalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  year: string;
  sortOrder: number;
  visible: boolean;
};

export function GalleryManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ items: GalleryItem[] }>({
    queryKey: ["admin-gallery"],
    queryFn: async () => (await fetch("/api/admin/gallery")).json(),
  });
  const items: GalleryItem[] = data?.items ?? [];

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>({ title: "", caption: "", year: String(new Date().getFullYear()), sortOrder: items.length, visible: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      if (!imageFile) throw new Error("Image file required");
      const form = new FormData();
      Object.entries(draft).forEach(([k, v]) => form.append(k, String(v)));
      form.append("image", imageFile);
      const res = await fetch("/api/admin/gallery", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setCreating(false);
      setDraft({ title: "", caption: "", year: String(new Date().getFullYear()), sortOrder: items.length + 1, visible: true });
      setImageFile(null);
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const update = async (id: string, patch: Partial<GalleryItem>, imageFile?: File) => {
    const form = new FormData();
    Object.entries(patch).forEach(([k, v]) => form.append(k, String(v)));
    if (imageFile) form.append("image", imageFile);
    await fetch(`/api/admin/gallery/${id}`, { method: "PATCH", body: form });
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this gallery item?")) return;
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  // Group by year
  const years = Array.from(new Set(items.map(i => i.year))).sort().reverse();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#B52A32] mb-2">/ Gallery</div>
          <h1 className="display text-2xl md:text-3xl font-bold text-white">Gallery Management</h1>
          <p className="text-sm text-[#A8A8A8] mt-1">{items.length} images across {years.length} years</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-full bg-[#B52A32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D83A43] min-h-[44px]">
          <Plus size={14} /> Add Image
        </button>
      </header>

      {error && <div className="glass rounded p-3 text-sm text-[#D83A43] border-l-2 border-[#B52A32]">{error}</div>}

      {creating && (
        <div className="glass rounded-lg p-5 border-l-2 border-[#B52A32]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New Gallery Image</h3>
            <button onClick={() => setCreating(false)} className="text-[#A8A8A8] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Labeled label="Title"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Year"><input value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Caption"><input value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Sort Order"><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value) || 0 })} className={inputCls} /></Labeled>
            <Labeled label="Image (JPEG/PNG/WebP, max 8MB)"><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="text-xs text-[#A8A8A8]" /></Labeled>
          </div>
          <button onClick={create} disabled={busy || !draft.title || !imageFile} className="mt-4 flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white hover:bg-[#D83A43]">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Upload Image
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-[#A8A8A8] text-sm">Loading…</div>
      ) : years.map(year => (
        <div key={year}>
          <div className="flex items-center gap-3 mb-3">
            <span className="mono text-xs uppercase tracking-widest text-[#A8A8A8]">{year}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.filter(i => i.year === year).map(item => (
              <div key={item.id} className="glass rounded-lg overflow-hidden">
                <div className="aspect-[3/4] bg-[#080808] relative">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => del(item.id)}
                    className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white p-1.5 rounded hover:bg-[#B52A32]"
                    aria-label="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                  {!item.visible && (
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-[10px] text-[#A8A8A8] px-2 py-1 rounded mono uppercase">
                      Hidden
                    </div>
                  )}
                  <label className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white p-1.5 rounded hover:bg-[#B52A32] cursor-pointer" title="Replace image">
                    <RefreshCw size={12} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) update(item.id, {}, file);
                      }}
                    />
                  </label>
                </div>
                <div className="p-3">
                  <input
                    value={item.title}
                    onChange={(e) => update(item.id, { title: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 text-sm text-white focus:border-[#B52A32] focus:outline-none pb-1"
                  />
                  <input
                    value={item.caption || ""}
                    placeholder="Caption"
                    onChange={(e) => update(item.id, { caption: e.target.value })}
                    className="w-full bg-transparent text-xs text-[#A8A8A8] focus:outline-none mt-1"
                  />
                  <button
                    onClick={() => update(item.id, { visible: !item.visible })}
                    className={`mt-2 text-xs px-3 py-1 rounded ${item.visible ? "bg-[#B52A32]/20 text-[#D83A43]" : "bg-[#151515] text-[#A8A8A8]"}`}
                  >
                    {item.visible ? "Visible" : "Hidden"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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
