"use client";

import { useRegisterStore } from "./store";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Plus, X, Check, Crown, AlertCircle } from "lucide-react";
import Link from "next/link";

const STEPS = ["TEAM", "MEMBERS", "DETAILS", "PAYMENT", "SUBMIT"];

export function RegisterStepper() {
  const step = useRegisterStore((s) => s.step);
  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto mb-10 md:mb-12">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                i < step
                  ? "border-[#B52A32] bg-[#B52A32] text-white"
                  : i === step
                    ? "border-[#B52A32] bg-transparent text-[#B52A32] red-glow"
                    : "border-white/15 text-[#A8A8A8]"
              }`}
            >
              {i < step ? <Check size={14} /> : String(i + 1).padStart(2, "0")}
            </div>
            <span
              className={`mono text-[9px] md:text-[10px] uppercase tracking-widest text-center ${
                i === step ? "text-white" : "text-[#A8A8A8]"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px mx-1.5 md:mx-4 bg-white/10 relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-[#B52A32] transition-transform duration-500 origin-left ${
                  i < step ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── STEP 0: TEAM ─────────────────────────────────────────────────────────────

export function StepTeam() {
  const { teamName, setTeamName, next } = useRegisterStore();
  const validFormat = teamName.trim().length >= 2 && /^[a-zA-Z0-9 _\-.]+$/.test(teamName);

  // Live team-name availability check (debounced via react-query staleTime)
  const { data: checkData, isLoading: checking } = useQuery({
    queryKey: ["team-name-check", teamName.trim()],
    queryFn: async () => {
      if (!validFormat) return { available: false, reason: "invalid" };
      const r = await fetch(`/api/registrations/check-team-name?name=${encodeURIComponent(teamName.trim())}`);
      return r.json();
    },
    enabled: validFormat,
    staleTime: 30_000,
  });

  const nameTaken = checkData?.available === false && checkData?.reason !== "too-short" && validFormat;
  const valid = validFormat && !nameTaken;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="display text-3xl md:text-5xl font-bold text-white mb-3">NAME YOUR CREW.</h2>
      <p className="text-sm md:text-base text-[#A8A8A8] mb-8 md:mb-10">
        Pick a team name. This is how you will be known throughout the mission.
      </p>

      <label className="block">
        <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
          Team Name
        </span>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter your team name"
          maxLength={60}
          className="mt-2 w-full bg-transparent border-b border-white/15 py-3 text-xl md:text-2xl text-white placeholder:text-[#A8A8A8]/40 focus:border-[#B52A32] focus:outline-none transition-colors"
        />
      </label>
      {teamName.trim().length >= 2 && (
        <div className="mt-2 text-xs">
          {checking ? (
            <span className="text-[#A8A8A8]">Checking availability…</span>
          ) : nameTaken ? (
            <span className="text-[#D83A43] flex items-center gap-1.5">
              <AlertCircle size={12} /> Team name already exists. Please choose a different team name.
            </span>
          ) : validFormat ? (
            <span className="text-green-400 flex items-center gap-1.5">
              <Check size={12} /> Team name is available.
            </span>
          ) : (
            <span className="text-[#D83A43]">Team name contains invalid characters.</span>
          )}
        </div>
      )}

      <div className="mt-8 md:mt-10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#A8A8A8] hover:text-white transition-colors min-h-[44px]"
        >
          <ArrowLeft size={14} /> Cancel
        </Link>
        <button
          disabled={!valid}
          onClick={next}
          className="group flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-30 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#D83A43] min-h-[44px]"
        >
          CONTINUE <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 1: MEMBERS (with team leader selection) ─────────────────────────────

export function StepMembers() {
  const { members, setMember, addMember, removeMember, next, prev } = useRegisterStore();
  const leaderIdx = members.findIndex((m) => m.isLeader);

  const memberValid = (m: typeof members[0]) =>
    m.fullName.trim().length >= 2 &&
    m.email.toLowerCase().trim().endsWith("@gmail.com") &&
    /^\d{10}$/.test(m.phone.trim()) &&
    m.college.trim().length >= 2;

  const allValid = members.every(memberValid);
  const emails = members.map((m) => m.email.toLowerCase().trim());
  const hasDuplicate = emails.some((e, i) => e && emails.indexOf(e) !== i);
  const hasLeader = leaderIdx >= 0;

  const valid = allValid && !hasDuplicate && hasLeader;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="display text-3xl md:text-5xl font-bold text-white mb-3">ASSEMBLE THE CREW.</h2>
      <p className="text-sm md:text-base text-[#A8A8A8] mb-8 md:mb-10">
        Minimum 3, maximum 4. Each member must have a unique email. Designate exactly one team leader.
      </p>

      <div className="space-y-4 md:space-y-6">
        {members.map((m, i) => {
          const isLeader = i === leaderIdx;
          return (
            <div
              key={i}
              className={`glass rounded-lg p-4 md:p-5 border transition-all ${
                isLeader ? "border-[#B52A32]/50" : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="mono text-xs uppercase tracking-widest text-[#B52A32]">
                    Member {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < 3 && <span className="text-[#A8A8A8] text-xs">· Required</span>}
                  {i === 3 && <span className="text-[#A8A8A8] text-xs">· Optional</span>}
                  {isLeader && (
                    <span className="inline-flex items-center gap-1 mono text-[10px] uppercase tracking-widest text-[#D83A43] border border-[#B52A32] px-2 py-0.5 rounded">
                      <Crown size={10} /> Leader
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {i >= 3 && (
                    <button
                      onClick={() => removeMember(i)}
                      className="text-[#A8A8A8] hover:text-[#B52A32] transition-colors p-1"
                      aria-label="Remove member"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Full Name" value={m.fullName} onChange={(v) => setMember(i, { fullName: v })} placeholder="Enter full name" />
                <Input label="Email" type="email" value={m.email} onChange={(v) => setMember(i, { email: v })} placeholder="example@gmail.com" />
                <Input label="Phone" type="tel" value={m.phone} onChange={(v) => setMember(i, { phone: v })} placeholder="10 digit number" />
                <Input label="College" value={m.college} onChange={(v) => setMember(i, { college: v })} placeholder="Enter your college / institution name" />
                <div className="md:col-span-2">
                  <DegreeField
                    value={m.degree}
                    onChange={(v) => setMember(i, { degree: v })}
                  />
                </div>
              </div>

              {/* Per-member validation hints */}
              {(!memberValid(m) || (hasDuplicate && emails.indexOf(emails[i]) !== i)) && (
                <div className="mt-3 space-y-1">
                  {m.fullName.trim().length > 0 && m.fullName.trim().length < 2 && (
                    <div className="text-xs text-[#D83A43]">• Full name must be at least 2 characters</div>
                  )}
                  {m.email.trim().length > 0 && !m.email.toLowerCase().trim().endsWith("@gmail.com") && (
                    <div className="text-xs text-[#D83A43]">• Email must be a @gmail.com address</div>
                  )}
                  {m.phone.trim().length > 0 && !/^\d{10}$/.test(m.phone.trim()) && (
                    <div className="text-xs text-[#D83A43]">• Phone must be exactly 10 digits (numbers only)</div>
                  )}
                  {m.college.trim().length > 0 && m.college.trim().length < 2 && (
                    <div className="text-xs text-[#D83A43]">• College name is required</div>
                  )}
                  {hasDuplicate && emails.indexOf(emails[i]) !== i && emails[i] && (
                    <div className="text-xs text-[#D83A43]">• This email is duplicated within the team</div>
                  )}
                </div>
              )}
              <div className="mt-3 md:mt-4">
                <button
                  onClick={() => {
                    // Toggle leader — set isLeader on this member only, clear others
                    const newLeader = !isLeader;
                    members.forEach((_, idx) => setMember(idx, { isLeader: false }));
                    setMember(i, { isLeader: newLeader });
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all min-h-[36px] ${
                    isLeader
                      ? "bg-[#B52A32] text-white"
                      : "border border-white/15 text-[#A8A8A8] hover:border-[#B52A32] hover:text-white"
                  }`}
                >
                  <Crown size={12} /> {isLeader ? "Team Leader" : "Mark as Team Leader"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {members.length < 4 && (
        <button
          onClick={addMember}
          className="mt-4 flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white hover:border-[#B52A32] hover:bg-white/5 transition-all min-h-[44px]"
        >
          <Plus size={14} /> Add Optional 4th Member
        </button>
      )}

      {/* Summary of what's blocking Continue */}
      {!valid && (members.some(m => m.fullName.trim() || m.email.trim() || m.phone.trim())) && (
        <div className="mt-4 glass rounded-lg p-4 border-l-2 border-[#B52A32]">
          <div className="text-xs font-semibold text-[#D83A43] mb-2">Complete these to continue:</div>
          <div className="space-y-1">
            {!allValid && (
              <div className="text-xs text-[#A8A8A8]">• Fill in all member fields correctly (name, @gmail.com email, 10-digit phone, college)</div>
            )}
            {hasDuplicate && (
              <div className="text-xs text-[#A8A8A8]">• Each member must have a unique email</div>
            )}
            {!hasLeader && (
              <div className="text-xs text-[#A8A8A8]">• Mark exactly one member as Team Leader</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 md:mt-10 flex items-center justify-between">
        <button
          onClick={prev}
          className="flex items-center gap-2 text-sm text-[#A8A8A8] hover:text-white transition-colors min-h-[44px]"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          disabled={!valid}
          onClick={next}
          className="group flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-30 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#D83A43] min-h-[44px]"
        >
          CONTINUE <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 2: DETAILS REVIEW ───────────────────────────────────────────────────

export function StepDetails() {
  const { teamName, members, next, prev } = useRegisterStore();
  const leaderIdx = members.findIndex((m) => m.isLeader);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="display text-3xl md:text-5xl font-bold text-white mb-3">CONFIRM THE BRIEF.</h2>
      <p className="text-sm md:text-base text-[#A8A8A8] mb-8 md:mb-10">
        Review your team details before proceeding to payment.
      </p>

      <div className="glass rounded-lg p-5 md:p-8">
        <div className="pb-4 md:pb-6 border-b border-white/5">
          <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Team</div>
          <div className="display text-xl md:text-2xl text-white mt-1 truncate">{teamName}</div>
        </div>

        <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
          {members.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b border-white/5 last:border-0 last:pb-0 ${i === leaderIdx ? "" : ""}`}>
              <div className={`flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full mono text-xs ${
                i === leaderIdx
                  ? "bg-[#B52A32] text-white"
                  : "bg-[#151515] border border-white/10 text-[#B52A32]"
              }`}>
                {i === leaderIdx ? <Crown size={14} /> : String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm md:text-base truncate">
                  {m.fullName}
                  {i === leaderIdx && <span className="ml-2 text-[10px] text-[#D83A43]">· LEADER</span>}
                </div>
                <div className="text-xs md:text-sm text-[#A8A8A8] truncate">{m.email}</div>
                <div className="text-xs text-[#A8A8A8] mt-0.5 truncate">{m.phone} · {m.college}</div>
                {m.degree && (
                  <div className="text-xs text-[#A8A8A8] mt-0.5 truncate">Degree: {m.degree}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 md:mt-10 flex items-center justify-between">
        <button
          onClick={prev}
          className="flex items-center gap-2 text-sm text-[#A8A8A8] hover:text-white transition-colors min-h-[44px]"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={next}
          className="group flex items-center gap-2 rounded-full bg-[#B52A32] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#D83A43] min-h-[44px]"
        >
          PROCEED TO PAYMENT <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: PAYMENT (config-driven fee + UPI) ────────────────────────────────

export function StepPayment() {
  const {
    transactionId, setTransactionId,
    screenshot, screenshotPreview, setScreenshot,
    next, prev, serverError, submitting,
    setTeamId, setPaymentId, setScreenshotPath,
    teamName, college, members,
    setServerError, setSubmitting,
  } = useRegisterStore();

  const { data: cfgData } = useQuery<{ config: any }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
  });
  const cfg = cfgData?.config;
  const fee = cfg?.registrationFee ?? "₹1,000";
  const qrUrl = cfg?.upiQrUrl || "/images/QRcode/payment-qr.png";

  const validTxn = transactionId.trim().length >= 4 && transactionId.trim().length <= 100;
  const valid = validTxn && screenshot !== null;

  const submitAll = async () => {
    setServerError(null);
    setSubmitting(true);
    try {
      // 1. Create the team (server validates team leader + college required)
      const regRes = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, college, members }),
      });
      const regJson = await regRes.json();
      if (!regRes.ok) throw new Error(regJson.error || "Registration failed");
      const newTeamId = regJson.team.id;
      setTeamId(newTeamId);

      // 2. Submit payment (transaction ID)
      const payRes = await fetch(`/api/registrations/${newTeamId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const payJson = await payRes.json();
      if (!payRes.ok) throw new Error(payJson.error || "Payment submission failed");
      setPaymentId(payJson.payment.id);

      // 3. Upload screenshot
      if (screenshot) {
        const form = new FormData();
        form.append("file", screenshot);
        const upRes = await fetch(`/api/registrations/${newTeamId}/payment-screenshot`, {
          method: "POST",
          body: form,
        });
        const upJson = await upRes.json();
        if (!upRes.ok) throw new Error(upJson.error || "Screenshot upload failed");
        setScreenshotPath(upJson.screenshot.filePath);
      }

      next();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="display text-3xl md:text-5xl font-bold text-white mb-3">TRANSMIT PAYMENT.</h2>
      <p className="text-sm md:text-base text-[#A8A8A8] mb-8 md:mb-10">
        Pay the registration fee via UPI, then enter the transaction ID and upload the screenshot.
      </p>

      <div className="glass rounded-lg p-5 md:p-8 mb-6 md:mb-8">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mb-2">
              Registration Fee
            </div>
            <div className="display text-4xl md:text-5xl text-white font-bold">{fee}</div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8] mt-4 md:mt-6 mb-2">
              UPI ID
            </div>
            <div className="font-mono text-sm md:text-base text-[#B52A32] select-all break-all">
              {cfg?.upiId ?? "—"}
            </div>
            <button
              onClick={() => {
                if (cfg?.upiId) navigator.clipboard?.writeText(cfg.upiId);
              }}
              className="mt-2 text-xs text-[#A8A8A8] hover:text-white transition-colors min-h-[36px]"
            >
              Tap to copy
            </button>
          </div>
          <div className="flex items-center justify-center">
            <div className="aspect-square w-44 max-w-full bg-white p-2 rounded">
              <img src={qrUrl} alt="Payment QR code" className="block h-full w-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      <label className="block mb-6">
        <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
          Transaction ID
        </span>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter your UPI transaction ID"
          className="mt-2 w-full bg-transparent border-b border-white/15 py-3 text-base md:text-lg text-white placeholder:text-[#A8A8A8]/40 focus:border-[#B52A32] focus:outline-none transition-colors"
        />
      </label>

      <label className="block">
        <span className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">
          Payment Screenshot (JPEG / PNG / WebP, max 8MB)
        </span>
        <div className="mt-2 glass rounded-lg p-4 border border-dashed border-white/15 hover:border-[#B52A32] transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            className="block w-full text-xs md:text-sm text-[#A8A8A8] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#B52A32] file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:bg-[#D83A43] cursor-pointer"
          />
          {screenshot && (
            <div className="mt-3 text-xs text-[#A8A8A8]">
              Selected: {screenshot.name} ({Math.round(screenshot.size / 1024)} KB)
            </div>
          )}
          {screenshot && screenshotPreview && (
            <img
              src={screenshotPreview}
              alt="Payment screenshot preview"
              className="mt-3 max-h-40 rounded border border-white/10"
            />
          )}
        </div>
      </label>

      {serverError && (
        <div className="mt-4 glass rounded-lg p-4 border-l-2 border-[#B52A32] text-sm text-[#D83A43]">
          {serverError}
        </div>
      )}

      <div className="mt-8 md:mt-10 flex items-center justify-between">
        <button
          onClick={prev}
          disabled={submitting}
          className="flex items-center gap-2 text-sm text-[#A8A8A8] hover:text-white transition-colors disabled:opacity-50 min-h-[44px]"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          disabled={!valid || submitting}
          onClick={submitAll}
          className="group flex items-center gap-2 rounded-full bg-[#B52A32] disabled:opacity-30 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#D83A43] min-h-[44px]"
        >
          {submitting ? "SUBMITTING…" : "SUBMIT PAYMENT"}
          {!submitting && <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />}
        </button>
      </div>
    </div>
  );
}

// ─── STEP 4: SUBMIT / CONFIRMATION ────────────────────────────────────────────

export function StepSubmit() {
  const { teamId, teamName, reset } = useRegisterStore();

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 rounded-full bg-[#B52A32] flex items-center justify-center red-glow">
          <Check size={28} className="text-white" />
        </div>
      </div>
      <h2 className="display text-3xl md:text-6xl font-bold text-white mb-3">PAYMENT UNDER REVIEW.</h2>
      <p className="text-sm md:text-base text-[#A8A8A8] mb-2">
        Your registration for <span className="text-white">{teamName}</span> has been received.
      </p>
      <p className="text-sm md:text-base text-[#A8A8A8] mb-10">
        The super admin will verify your payment shortly. Once approved, you will receive a unique registration ID and your crew will be issued digital passes with QR credentials for the food check-in system.
      </p>

      {teamId && (
        <div className="glass rounded-lg p-6 mb-10">
          <div className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">Reference</div>
          <div className="mono text-sm md:text-lg text-[#B52A32] mt-1 select-all break-all">{teamId}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/5 transition-all min-h-[44px] flex items-center justify-center"
        >
          Return Home
        </Link>
        <button
          onClick={() => reset()}
          className="rounded-full bg-[#B52A32] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D83A43] transition-all min-h-[44px]"
        >
          Register Another Team
        </button>
      </div>
    </div>
  );
}

// ─── SHARED INPUT ─────────────────────────────────────────────────────────────

function Input({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mono text-xs uppercase tracking-widest text-[#A8A8A8]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent border-b border-white/15 py-2 text-base text-white placeholder:text-[#A8A8A8]/40 focus:border-[#B52A32] focus:outline-none transition-colors"
      />
    </label>
  );
}

// ─── DEGREE FIELD (dropdown + custom text input) ─────────────────────────────

const DEGREE_OPTIONS = [
  "B.E",
  "B.Tech",
  "M.E",
  "M.Tech",
  "MCA",
  "M.Sc",
  "B.Sc",
  "BCA",
  "Diploma",
  "Ph.D",
  "Other",
];

function DegreeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Determine if the current value is one of the preset options (not "Other")
  const isPreset = DEGREE_OPTIONS.includes(value) && value !== "Other";
  const isOtherSelected = !isPreset && value !== "" && !DEGREE_OPTIONS.includes(value);
  // The select's value: show "Other" when the stored value is custom (or "Other")
  const selectValue = isOtherSelected || value === "Other" ? "Other" : isPreset ? value : "";

  return (
    <div>
      <label className="block">
        <span className="mono text-xs uppercase tracking-widest text-[#A8A8A8]">Degree</span>
        <select
          value={selectValue}
          onChange={(e) => {
            if (e.target.value === "Other") {
              // Switching to "Other" — keep existing custom text if any, else empty
              onChange(isOtherSelected ? value : "");
            } else {
              onChange(e.target.value);
            }
          }}
          className="mt-1 w-full bg-transparent border-b border-white/15 py-2 text-base text-white focus:border-[#B52A32] focus:outline-none transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled className="bg-[#080808] text-[#A8A8A8]">Select degree (optional)</option>
          {DEGREE_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="bg-[#080808] text-white">
              {opt}
            </option>
          ))}
        </select>
      </label>
      {(isOtherSelected || selectValue === "Other") && (
        <label className="block mt-2">
          <span className="mono text-xs uppercase tracking-widest text-[#A8A8A8]">Specify your degree</span>
          <input
            type="text"
            value={isOtherSelected ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your degree"
            maxLength={60}
            className="mt-1 w-full bg-transparent border-b border-white/15 py-2 text-base text-white placeholder:text-[#A8A8A8]/40 focus:border-[#B52A32] focus:outline-none transition-colors"
          />
        </label>
      )}
    </div>
  );
}
