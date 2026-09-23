import { db } from "@/lib/db";

/**
 * Event lifecycle states — derived from real configured timestamps.
 * This is the SINGLE source of truth for event state across the entire app.
 *
 * States (in chronological order):
 *   UPCOMING          — before registration opens
 *   REGISTRATION_OPEN — registration open, event not started
 *   REGISTRATION_CLOSED — registration deadline passed, event not started yet
 *   LIVE              — event is currently running
 *   ENDED             — event end time has passed
 */
export type EventState =
  | "UPCOMING"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "LIVE"
  | "ENDED";

export interface EventStateInfo {
  state: EventState;
  /** ISO string of event start (Asia/Kolkata interpreted) */
  eventStartIso: string | null;
  /** ISO string of event end */
  eventEndIso: string | null;
  /** ISO string of registration deadline */
  registrationDeadlineIso: string | null;
  /** ISO string of registration open (defaults to "now" if not set, meaning always open until deadline) */
  registrationOpensIso: string | null;
  /** Duration in hours */
  durationHours: number;
  /** Timezone (IANA) — always Asia/Kolkata for this event */
  timezone: string;
  /** Whether registration is currently allowed (state === REGISTRATION_OPEN) */
  registrationOpen: boolean;
  /** Optional reason message for closed registration */
  registrationMessage: string;
  /** Manual registration open/close toggle (EventConfig.registrationsOpen) */
  registrationsOpen: boolean;
  /** Maximum number of teams allowed (EventConfig.registrationCapacity) */
  registrationCapacity: number;
  /** Current number of registered teams */
  currentCount: number;
  /** True when registration is open AND not full */
  registrationAvailable: boolean;
}

/**
 * Compute the current event state from the EventConfig + current time.
 * Uses UTC internally; all display conversions use the configured timezone.
 *
 * This is a PURE function — given the config + a timestamp, output is deterministic.
 * Safe to call from server components / API routes / client components.
 */
export function computeEventState(cfg: {
  eventStartDate?: string | null;
  eventStartTime?: string | null;
  eventEndDate?: string | null;
  eventEndTime?: string | null;
  eventTimezone?: string | null;
  eventDurationHours?: number | null;
  registrationDeadline?: string | null;
  registrationOpens?: string | null;
  registrationsOpen?: boolean | null;
  registrationCapacity?: number | null;
  currentCount?: number | null;
}, now: Date = new Date()): EventStateInfo {
  const timezone = cfg.eventTimezone || "Asia/Kolkata";
  const durationHours = cfg.eventDurationHours || 24;

  const eventStartIso = composeIso(
    cfg.eventStartDate,
    cfg.eventStartTime,
    timezone,
  );
  // Auto-calculate eventEndIso from Start + Duration (single source of truth — no separate End Date/Time)
  const eventEndIso = eventStartIso
    ? new Date(new Date(eventStartIso).getTime() + durationHours * 3600000).toISOString()
    : null;
  const registrationDeadlineIso = cfg.registrationDeadline || null;
  const registrationOpensIso = cfg.registrationOpens || null;

  let state: EventState = "UPCOMING";
  let registrationMessage = "";

  const nowMs = now.getTime();
  const startMs = eventStartIso ? new Date(eventStartIso).getTime() : NaN;
  const endMs = eventEndIso ? new Date(eventEndIso).getTime() : NaN;
  const deadlineMs = registrationDeadlineIso ? new Date(registrationDeadlineIso).getTime() : NaN;
  const opensMs = registrationOpensIso ? new Date(registrationOpensIso).getTime() : NaN;

  if (!isNaN(endMs) && nowMs >= endMs) {
    state = "ENDED";
  } else if (!isNaN(startMs) && nowMs >= startMs) {
    state = "LIVE";
  } else if (!isNaN(deadlineMs) && nowMs >= deadlineMs) {
    state = "REGISTRATION_CLOSED";
    registrationMessage = "Registration is closed.";
  } else if (!isNaN(opensMs) && nowMs < opensMs) {
    state = "UPCOMING";
    registrationMessage = "Registration opens soon.";
  } else {
    state = "REGISTRATION_OPEN";
  }

  const registrationsOpen = cfg.registrationsOpen ?? true;
  const registrationCapacity = cfg.registrationCapacity ?? 60;
  const currentCount = cfg.currentCount ?? 0;
  const isFull = registrationCapacity > 0 && currentCount >= registrationCapacity;
  // Registration is "available" when state is REGISTRATION_OPEN AND the manual
  // toggle is on AND there's still capacity.
  const registrationAvailable =
    state === "REGISTRATION_OPEN" && registrationsOpen && !isFull;

  return {
    state,
    eventStartIso,
    eventEndIso,
    registrationDeadlineIso,
    registrationOpensIso,
    durationHours,
    timezone,
    registrationOpen: state === "REGISTRATION_OPEN",
    registrationMessage,
    registrationsOpen,
    registrationCapacity,
    currentCount,
    registrationAvailable,
  };
}

/**
 * Convert a local wall-clock date/time in an IANA timezone into a UTC ISO string.
 *
 * Example:
 *   2026-10-28 11:00 Asia/Kolkata
 *   -> 2026-10-28T05:30:00.000Z
 *
 * Uses Intl instead of adding a timezone dependency.
 */
function composeIso(
  date?: string | null,
  time?: string | null,
  timezone: string = "Asia/Kolkata",
): string | null {
  if (!date) return null;

  const t = time && time.length >= 5 ? time : "00:00";
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = t.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute);

  const getTimeZoneOffsetMs = (utcMs: number): number => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utcMs));

    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );

    const displayedUtcMs = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    );

    return displayedUtcMs - utcMs;
  };

  // First approximation, then correct for the timezone offset.
  const firstOffset = getTimeZoneOffsetMs(targetUtcMs);
  let utcMs = targetUtcMs - firstOffset;

  // A second pass handles timezone transitions/DST boundaries.
  const secondOffset = getTimeZoneOffsetMs(utcMs);
  utcMs = targetUtcMs - secondOffset;

  return new Date(utcMs).toISOString();
}

/**
 * Fetch the current EventStateInfo from the database.
 * Use this in server components / API routes.
 */
export async function getEventState(): Promise<EventStateInfo> {
  const cfg = await db.eventConfig.findUnique({ where: { id: "singleton" } });
  if (!cfg) {
    // No config — treat as upcoming with no registration
    return {
      state: "UPCOMING",
      eventStartIso: null,
      eventEndIso: null,
      registrationDeadlineIso: null,
      registrationOpensIso: null,
      durationHours: 24,
      timezone: "Asia/Kolkata",
      registrationOpen: false,
      registrationMessage: "Event not configured.",
      registrationsOpen: true,
      registrationCapacity: 60,
      currentCount: 0,
      registrationAvailable: false,
    };
  }

  // Count current teams (a cheap query against the Team table)
  const currentCount = await db.team.count();

  return computeEventState({
    ...cfg,
    currentCount,
  });
}

/**
 * Format a duration (ms) as HH:MM:SS for live phase countdowns.
 */
export function formatDuration(ms: number): { hours: number; minutes: number; seconds: number } {
  const clamped = Math.max(0, ms);
  return {
    hours: Math.floor(clamped / 3600000),
    minutes: Math.floor((clamped % 3600000) / 60000),
    seconds: Math.floor((clamped % 60000) / 1000),
  };
}

/**
 * Format an ISO string in the configured timezone for display.
 * Returns a human-readable date/time string.
 */
export function formatInTimezone(iso: string | null, timezone: string = "Asia/Kolkata"): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date(iso).toLocaleString();
  }
}
