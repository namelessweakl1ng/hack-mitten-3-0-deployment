/**
 * Event state system tests — verifies the single source of truth for event lifecycle.
 *
 * Run: bun test tests/event-state.test.ts
 */
import { describe, it, expect } from "bun:test";
import { computeEventState } from "../src/lib/event-state";

describe("computeEventState", () => {
  const baseConfig = {
    eventStartDate: "2099-01-15",
    eventStartTime: "09:00",
    eventEndDate: "2099-01-16",
    eventEndTime: "09:00",
    eventTimezone: "Asia/Kolkata",
    eventDurationHours: 24,
    registrationDeadline: "2099-01-10T23:59:59Z",
    registrationOpens: null,
  };

  it("returns REGISTRATION_OPEN when now is before deadline and before event start", () => {
    const now = new Date("2099-01-05T12:00:00Z");
    const state = computeEventState(baseConfig, now);
    expect(state.state).toBe("REGISTRATION_OPEN");
    expect(state.registrationOpen).toBe(true);
  });

  it("returns REGISTRATION_CLOSED when now is after deadline but before event start", () => {
    const now = new Date("2099-01-12T12:00:00Z");
    const state = computeEventState(baseConfig, now);
    expect(state.state).toBe("REGISTRATION_CLOSED");
    expect(state.registrationOpen).toBe(false);
    expect(state.registrationMessage).toContain("closed");
  });

  it("returns LIVE when now is between event start and end", () => {
    const now = new Date("2099-01-15T18:00:00Z");
    const state = computeEventState(baseConfig, now);
    expect(state.state).toBe("LIVE");
    expect(state.registrationOpen).toBe(false);
  });

  it("returns ENDED when now is after event end", () => {
    const now = new Date("2099-02-01T00:00:00Z");
    const state = computeEventState(baseConfig, now);
    expect(state.state).toBe("ENDED");
    expect(state.registrationOpen).toBe(false);
  });

  it("returns UPCOMING when registration opens is in the future", () => {
    const now = new Date("2099-01-01T00:00:00Z");
    const state = computeEventState({
      ...baseConfig,
      registrationOpens: "2099-01-03T00:00:00Z",
      registrationDeadline: "2099-01-10T23:59:59Z",
    }, now);
    expect(state.state).toBe("UPCOMING");
    expect(state.registrationOpen).toBe(false);
  });

  it("returns UPCOMING with no event dates set (empty config)", () => {
    const state = computeEventState({}, new Date());
    expect(state.state).toBe("REGISTRATION_OPEN"); // no deadline = open
    expect(state.registrationOpen).toBe(true);
    expect(state.durationHours).toBe(24);
    expect(state.timezone).toBe("Asia/Kolkata");
  });

  it("uses default 24h duration when not specified", () => {
    const state = computeEventState({
      eventStartDate: "2099-01-15",
      eventStartTime: "09:00",
      // no eventEndDate → should auto-calculate from duration
    }, new Date("2099-01-05T00:00:00Z"));
    expect(state.eventEndIso).not.toBeNull();
    expect(state.durationHours).toBe(24);
  });

  it("handles timezone field correctly", () => {
    const state = computeEventState({
      ...baseConfig,
      eventTimezone: "America/New_York",
    });
    expect(state.timezone).toBe("America/New_York");
  });
});
