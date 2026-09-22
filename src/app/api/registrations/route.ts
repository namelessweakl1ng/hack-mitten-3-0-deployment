import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrationSchema } from "@/lib/validators";
import { jsonError } from "@/lib/api-auth";
import { getEventState } from "@/lib/event-state";

/**
 * POST /api/registrations
 * Create a new team registration (status = SUBMITTED).
 * Enforces:
 *   - Registration deadline (server-side via event-state single source of truth): returns 403 if past deadline
 *   - registrationsOpen toggle (EventConfig) — if false, returns 403
 *   - Registration capacity (EventConfig) — if at capacity, returns 403
 *   - 3-4 members
 *   - Exactly one team leader
 *   - College name required on every member
 *   - No duplicate member emails within the team
 *   - Unique team name (DB constraint)
 */
export async function POST(req: Request) {
  try {
    // ─── Registration deadline enforcement (single source of truth) ──────
    const eventState = await getEventState();
    if (!eventState.registrationOpen) {
      return NextResponse.json(
        { error: eventState.registrationMessage || "Registration is closed.", code: "REG_CLOSED" },
        { status: 403 },
      );
    }

    // ─── registrationsOpen toggle (manual close) ─────────────────────────
    if (!eventState.registrationsOpen) {
      return NextResponse.json(
        { error: "Registrations are currently closed.", code: "REG_CLOSED_MANUAL" },
        { status: 403 },
      );
    }

    // ─── Capacity check (atomic with team creation via transaction) ─────
    if (eventState.registrationCapacity > 0 && eventState.currentCount >= eventState.registrationCapacity) {
      return NextResponse.json(
        { error: "Registration is full. All spots have been taken.", code: "REG_FULL" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { teamName, college, members } = parsed.data;

    // Check team name uniqueness (explicit error message for the user)
    const existing = await db.team.findUnique({ where: { teamName } });
    if (existing) {
      return NextResponse.json(
        { error: "Team name already exists. Please choose a different team name.", code: "TEAM_NAME_TAKEN" },
        { status: 409 },
      );
    }

    // ─── Transaction: re-check capacity atomically + create team ────────
    // Re-counting inside the transaction prevents the race where two registrations
    // slip through the capacity check simultaneously.
    const team = await db.$transaction(async (tx) => {
      const currentCount = await tx.team.count();
      const cfg = await tx.eventConfig.findUnique({ where: { id: "singleton" } });
      const capacity = cfg?.registrationCapacity ?? 60;
      const open = cfg?.registrationsOpen ?? true;
      if (!open) {
        throw new Error("Registrations are currently closed.");
      }
      if (capacity > 0 && currentCount >= capacity) {
        throw new Error("Registration is full. All spots have been taken.");
      }

      return tx.team.create({
        data: {
          teamName,
          college: college ?? members[0]?.college ?? null,
          status: "SUBMITTED",
          members: {
            create: members.map((m) => ({
              fullName: m.fullName,
              email: m.email.toLowerCase().trim(),
              phone: m.phone.trim(),
              college: m.college,
              degree: m.degree || null,
              isLeader: m.isLeader,
            })),
          },
        },
        include: { members: true },
      });
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    // Surface our capacity/close errors as 403, otherwise default jsonError handling
    if (err instanceof Error && (err.message === "Registrations are currently closed." || err.message === "Registration is full. All spots have been taken.")) {
      return NextResponse.json({ error: err.message, code: err.message.includes("closed") ? "REG_CLOSED_MANUAL" : "REG_FULL" }, { status: 403 });
    }
    return jsonError(err);
  }
}

/**
 * GET /api/registrations/check-team-name?name=...
 * Public endpoint — checks if a team name is available (for live validation in the registration form).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name")?.trim() ?? "";
  if (name.length < 2) {
    return NextResponse.json({ available: false, reason: "too-short" });
  }
  const existing = await db.team.findUnique({ where: { teamName: name } });
  return NextResponse.json({ available: !existing });
}

