"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Check } from "lucide-react";

type EventConfig = {
  eventName: string;
  edition: string;
  tagline: string;
  description: string;
  eventStartDate: string;
  eventStartTime: string;
  eventEndDate: string;
  eventEndTime: string;
  eventTimezone: string;
  eventDurationHours: number;
  registrationDeadline: string;
  registrationFee: string;
  prizePool: string;
  registrationCapacity: number;
  registrationsOpen: boolean;
  heroHeading: string;
  heroEdition: string;
  heroSubtitle: string;
  heroDescription: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroVisible: boolean;
  aboutHeading: string;
  aboutDescription: string;
  aboutStatDuration: string;
  aboutStatTeamSize: string;
  aboutStatFee: string;
  aboutStatPrize: string;
  aboutStatVenue: string;
  footerText: string;
  collegeName: string;
  collegeLogoUrl: string;
  contactEmail: string;
  upiId: string;
  upiQrUrl: string;
  winnersVisible: boolean;
  winnersHeading: string;
  winnersSubheading: string;
  socialLinks: any;
};

export function EventSettingsEditor() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ config: EventConfig }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });
  const [form, setForm] = useState<EventConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when data arrives
  if (data && !form) setForm({ ...data.config, socialLinks: parseSocial(data.config.socialLinks) });

  const update = (k: keyof EventConfig, v: any) => {
    setForm((f) => f ? { ...f, [k]: v } : f);
    setSaved(false);
  };
  const updateSocial = (k: string, v: string) => {
    setForm((f) => f ? { ...f, socialLinks: { ...(typeof f.socialLinks === "object" ? f.socialLinks : {}), [k]: v } } : f);
    setSaved(false);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, socialLinks: form.socialLinks }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to save");
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["config"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !form) {
    return <div className="text-[#A8A8A8]">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.3em] text-[#B52A32] mb-2">/ Event Settings</div>
          <h1 className="display text-2xl md:text-3xl font-bold text-white">Event Configuration</h1>
          <p className="text-sm text-[#A8A8A8] mt-1">All changes take effect immediately on the public site.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D83A43] transition-all min-h-[44px]"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </button>
      </header>

      {error && (
        <div className="glass rounded p-3 text-sm text-[#D83A43] border-l-2 border-[#B52A32]">{error}</div>
      )}

      {/* Basics */}
      <Section title="Basics">
        <Field label="Event Name" value={form.eventName} onChange={(v) => update("eventName", v)} />
        <Field label="Edition" value={form.edition} onChange={(v) => update("edition", v)} />
        <Field label="Tagline" value={form.tagline} onChange={(v) => update("tagline", v)} />
        <Field label="Description" value={form.description} onChange={(v) => update("description", v)} textarea />
      </Section>

      {/* Event Schedule — single source of truth for event timing */}
      <Section title="Event Schedule (single source of truth)">
        <Field label="Event Start Date" value={form.eventStartDate} onChange={(v) => update("eventStartDate", v)} type="date" />
        <Field label="Event Start Time" value={form.eventStartTime} onChange={(v) => update("eventStartTime", v)} type="time" />
        <Field label="Duration (hours)" value={String(form.eventDurationHours)} onChange={(v) => update("eventDurationHours", parseInt(v) || 24)} type="number" />
        <Field label="Timezone (IANA)" value={form.eventTimezone} onChange={(v) => update("eventTimezone", v)} placeholder="Asia/Kolkata" />
        <div className="md:col-span-2 text-xs text-[#A8A8A8] mono">
          Event end is auto-calculated from Start + Duration. Phase-specific times are configured separately in the Timeline section.
        </div>
      </Section>

      {/* Registration */}
      <Section title="Registration">
        <Field label="Registration Deadline (ISO datetime)" value={form.registrationDeadline} onChange={(v) => update("registrationDeadline", v)} />
        <Field label="Registration Fee" value={form.registrationFee} onChange={(v) => update("registrationFee", v)} placeholder="₹1,000" />
        <Field label="Prize Pool" value={form.prizePool} onChange={(v) => update("prizePool", v)} placeholder="₹1,00,000" />
      </Section>

      {/* Registration Control — capacity & open/close toggle */}
      <RegistrationControlSection
        registrationsOpen={form.registrationsOpen}
        registrationCapacity={form.registrationCapacity}
        onToggleOpen={(v) => update("registrationsOpen", v)}
        onCapacityChange={(v) => update("registrationCapacity", v)}
      />

      {/* Hero */}
      <Section title="Hero">
        <Field label="Hero Heading" value={form.heroHeading} onChange={(v) => update("heroHeading", v)} />
        <Field label="Hero Edition" value={form.heroEdition} onChange={(v) => update("heroEdition", v)} />
        <Field label="Hero Subtitle" value={form.heroSubtitle} onChange={(v) => update("heroSubtitle", v)} />
        <Field label="Hero Description" value={form.heroDescription} onChange={(v) => update("heroDescription", v)} textarea />
        <Field label="CTA Text" value={form.heroCtaText} onChange={(v) => update("heroCtaText", v)} />
        <Field label="CTA Link" value={form.heroCtaLink} onChange={(v) => update("heroCtaLink", v)} />
        <Toggle label="Hero Visible" value={form.heroVisible} onChange={(v) => update("heroVisible", v)} />
      </Section>

      {/* About */}
      <Section title="About">
        <Field label="About Heading" value={form.aboutHeading} onChange={(v) => update("aboutHeading", v)} />
        <Field label="About Description" value={form.aboutDescription} onChange={(v) => update("aboutDescription", v)} textarea />
        <Field label="Stat: Duration" value={form.aboutStatDuration} onChange={(v) => update("aboutStatDuration", v)} />
        <Field label="Stat: Team Size" value={form.aboutStatTeamSize} onChange={(v) => update("aboutStatTeamSize", v)} />
        <Field label="Stat: Fee" value={form.aboutStatFee} onChange={(v) => update("aboutStatFee", v)} />
        <Field label="Stat: Prize" value={form.aboutStatPrize} onChange={(v) => update("aboutStatPrize", v)} />
        <Field label="Stat: Venue" value={form.aboutStatVenue} onChange={(v) => update("aboutStatVenue", v)} />
      </Section>

      {/* Footer */}
      <Section title="Footer">
        <Field label="Footer Text" value={form.footerText} onChange={(v) => update("footerText", v)} />
        <Field label="College Name" value={form.collegeName} onChange={(v) => update("collegeName", v)} />
        <Field label="Contact Email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} />
        <div className="md:col-span-2">
          <label className="block">
            <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">College Logo (upload)</span>
            <div className="mt-1 flex items-center gap-3">
              {form.collegeLogoUrl && (
                <img src={form.collegeLogoUrl} alt="College logo" className="h-12 w-auto object-contain bg-white/5 rounded p-1" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formdata = new FormData();
                  // Include all current text fields so they're not lost
                  for (const k of ["eventName","edition","tagline","description","eventStartDate","eventStartTime","eventEndDate","eventEndTime","eventTimezone","registrationDeadline","registrationFee","prizePool","heroHeading","heroEdition","heroSubtitle","heroDescription","heroCtaText","heroCtaLink","aboutHeading","aboutDescription","aboutStatDuration","aboutStatTeamSize","aboutStatFee","aboutStatPrize","aboutStatVenue","footerText","collegeName","contactEmail","upiId","winnersHeading","winnersSubheading"] as const) {
                    formdata.append(k, String((form as any)[k] ?? ""));
                  }
                  formdata.append("eventDurationHours", String(form.eventDurationHours));
                  formdata.append("heroVisible", String(form.heroVisible));
                  formdata.append("winnersVisible", String(form.winnersVisible));
                  formdata.append("registrationCapacity", String(form.registrationCapacity));
                  formdata.append("registrationsOpen", String(form.registrationsOpen));
                  formdata.append("socialLinks", JSON.stringify(form.socialLinks));
                  formdata.append("collegeLogo", file);
                  setUploading(true);
                  try {
                    const res = await fetch("/api/admin/config", { method: "PATCH", body: formdata });
                    const j = await res.json();
                    if (!res.ok) throw new Error(j.error || "Upload failed");
                    setForm((f) => f ? { ...f, collegeLogoUrl: j.config.collegeLogoUrl } : f);
                    qc.invalidateQueries({ queryKey: ["config"] });
                  } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
                  finally { setUploading(false); }
                }}
                className="text-xs text-[#A8A8A8] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-[#B52A32] file:text-white file:text-xs file:cursor-pointer hover:file:bg-[#D83A43]"
              />
              {uploading && <span className="text-xs text-[#A8A8A8]">Uploading…</span>}
            </div>
          </label>
        </div>
      </Section>

      {/* Payment */}
      <Section title="Payment (UPI)">
        <Field label="UPI ID" value={form.upiId} onChange={(v) => update("upiId", v)} />
        <div className="md:col-span-2">
          <label className="block">
            <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">UPI QR Code (upload)</span>
            <div className="mt-1 flex items-center gap-3">
              {form.upiQrUrl && (
                <img src={form.upiQrUrl} alt="UPI QR" className="h-24 w-24 object-contain bg-white p-1 rounded" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formdata = new FormData();
                  for (const k of ["eventName","edition","tagline","description","eventStartDate","eventStartTime","eventEndDate","eventEndTime","eventTimezone","registrationDeadline","registrationFee","prizePool","heroHeading","heroEdition","heroSubtitle","heroDescription","heroCtaText","heroCtaLink","aboutHeading","aboutDescription","aboutStatDuration","aboutStatTeamSize","aboutStatFee","aboutStatPrize","aboutStatVenue","footerText","collegeName","contactEmail","upiId","winnersHeading","winnersSubheading"] as const) {
                    formdata.append(k, String((form as any)[k] ?? ""));
                  }
                  formdata.append("eventDurationHours", String(form.eventDurationHours));
                  formdata.append("heroVisible", String(form.heroVisible));
                  formdata.append("winnersVisible", String(form.winnersVisible));
                  formdata.append("registrationCapacity", String(form.registrationCapacity));
                  formdata.append("registrationsOpen", String(form.registrationsOpen));
                  formdata.append("socialLinks", JSON.stringify(form.socialLinks));
                  formdata.append("upiQr", file);
                  setUploading(true);
                  try {
                    const res = await fetch("/api/admin/config", { method: "PATCH", body: formdata });
                    const j = await res.json();
                    if (!res.ok) throw new Error(j.error || "Upload failed");
                    setForm((f) => f ? { ...f, upiQrUrl: j.config.upiQrUrl } : f);
                    qc.invalidateQueries({ queryKey: ["config"] });
                  } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
                  finally { setUploading(false); }
                }}
                className="text-xs text-[#A8A8A8] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-[#B52A32] file:text-white file:text-xs file:cursor-pointer hover:file:bg-[#D83A43]"
              />
              {uploading && <span className="text-xs text-[#A8A8A8]">Uploading…</span>}
            </div>
          </label>
        </div>
      </Section>

      {/* Winners */}
      <Section title="Winners">
        <Toggle label="Show Winners on public site" value={form.winnersVisible} onChange={(v) => update("winnersVisible", v)} />
        <Field label="Winners Heading" value={form.winnersHeading} onChange={(v) => update("winnersHeading", v)} />
        <Field label="Winners Subheading" value={form.winnersSubheading} onChange={(v) => update("winnersSubheading", v)} />
      </Section>

      {/* Social Links */}
      <Section title="Social Links">
        <Field label="Instagram URL" value={form.socialLinks?.instagram || ""} onChange={(v) => updateSocial("instagram", v)} />
        <Field label="LinkedIn URL" value={form.socialLinks?.linkedin || ""} onChange={(v) => updateSocial("linkedin", v)} />
      </Section>
    </div>
  );
}

function parseSocial(s: any): any {
  if (typeof s === "object" && s !== null) return s;
  try { return JSON.parse(s || "{}"); } catch { return {}; }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-lg p-5">
      <h2 className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mb-4">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label, value, onChange, type = "text", textarea = false, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="mt-1 w-full bg-[#080808] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-[#B52A32] focus:outline-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full bg-[#080808] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-[#B52A32] focus:outline-none"
        />
      )}
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-[#B52A32]" : "bg-[#252525]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
      <span className="text-sm text-white">{label}</span>
    </label>
  );
}

// ─── Registration Control section ─────────────────────────────────────────────
// Capacity + open/close toggle + live stats pulled from /api/event-state.

function RegistrationControlSection({
  registrationsOpen,
  registrationCapacity,
  onToggleOpen,
  onCapacityChange,
}: {
  registrationsOpen: boolean;
  registrationCapacity: number;
  onToggleOpen: (v: boolean) => void;
  onCapacityChange: (v: number) => void;
}) {
  // Pull the live currentCount + status from /api/event-state (refetch every minute).
  const { data: state } = useQuery<{ currentCount: number; registrationCapacity: number; registrationsOpen: boolean; registrationAvailable: boolean; state: string }>({
    queryKey: ["event-state"],
    queryFn: async () => (await fetch("/api/event-state")).json(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const currentCount = state?.currentCount ?? 0;
  const capacity = registrationCapacity || 60;
  const remaining = Math.max(0, capacity - currentCount);
  const isFull = capacity > 0 && currentCount >= capacity;
  const isClosed = !registrationsOpen;
  // Status: CLOSED takes priority over FULL
  const statusLabel = isClosed ? "CLOSED" : isFull ? "FULL" : "OPEN";
  const statusColor = isClosed ? "text-yellow-400" : isFull ? "text-[#D83A43]" : "text-green-400";

  return (
    <section className="glass rounded-lg p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Registration Control</h2>
        <span className={`text-xs font-semibold ${statusColor}`}>Status: {statusLabel}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Toggle label="Accept Incoming Registrations" value={registrationsOpen} onChange={onToggleOpen} />
        <label className="block">
          <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Registration Capacity</span>
          <input
            type="number"
            min={0}
            value={String(registrationCapacity)}
            onChange={(e) => onCapacityChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="mt-1 w-full bg-[#080808] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-[#B52A32] focus:outline-none"
          />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded border border-white/10 bg-[#080808] p-3">
          <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Current</div>
          <div className="display text-2xl font-bold text-white mt-1">{currentCount} <span className="text-[#A8A8A8] text-base">/ {capacity}</span></div>
        </div>
        <div className="rounded border border-white/10 bg-[#080808] p-3">
          <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Remaining</div>
          <div className="display text-2xl font-bold text-white mt-1">{remaining}</div>
        </div>
        <div className="rounded border border-white/10 bg-[#080808] p-3">
          <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Status</div>
          <div className={`display text-2xl font-bold mt-1 ${statusColor}`}>{statusLabel}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-[#A8A8A8]">
        Toggle ON to accept new registrations. Capacity caps the total number of teams; once reached, the public site shows "Registrations Full".
      </div>
    </section>
  );
}
