import { describe, expect, it } from "bun:test";
import bcrypt from "bcryptjs";

import { roleMatchesSelectedRole, verifyPasswordAndRole } from "@/lib/auth";

describe("role mapping", () => {
  it("maps ADMIN to SUPER_ADMIN", () => {
    expect(roleMatchesSelectedRole("ADMIN", "SUPER_ADMIN")).toBe(true);
  });

  it("maps COORDINATOR to COORDINATOR", () => {
    expect(roleMatchesSelectedRole("COORDINATOR", "COORDINATOR")).toBe(true);
  });

  it("maps FOOD to FOOD_ADMIN", () => {
    expect(roleMatchesSelectedRole("FOOD", "FOOD_ADMIN")).toBe(true);
  });
});

describe("password verification", () => {
  const passwordHashPromise = bcrypt.hash("correct-password", 12);

  it("accepts a valid matching password", async () => {
    const passwordHash = await passwordHashPromise;
    const ok = await verifyPasswordAndRole({
      identifier: "superadmin",
      password: "correct-password",
      selectedRole: "ADMIN",
      user: {
        id: "u1",
        username: "superadmin",
        email: "superadmin@example.com",
        role: "SUPER_ADMIN",
        passwordHash,
      },
    });

    expect(ok).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await passwordHashPromise;
    const ok = await verifyPasswordAndRole({
      identifier: "superadmin",
      password: "wrong-password",
      selectedRole: "ADMIN",
      user: {
        id: "u1",
        username: "superadmin",
        email: "superadmin@example.com",
        role: "SUPER_ADMIN",
        passwordHash,
      },
    });

    expect(ok).toBe(false);
  });

  it("rejects a user that is not present in the database", async () => {
    const ok = await verifyPasswordAndRole({
      identifier: "missing-user",
      password: "whatever",
      selectedRole: "ADMIN",
      user: null,
    });

    expect(ok).toBe(false);
  });

  it("rejects a mismatched role even when the password is correct", async () => {
    const passwordHash = await passwordHashPromise;
    const ok = await verifyPasswordAndRole({
      identifier: "coordinator",
      password: "correct-password",
      selectedRole: "ADMIN",
      user: {
        id: "u2",
        username: "coordinator",
        email: "coordinator@example.com",
        role: "COORDINATOR",
        passwordHash,
      },
    });

    expect(ok).toBe(false);
  });

  it("never trusts environment credentials alone without password verification", async () => {
    const passwordHash = await passwordHashPromise;
    const ok = await verifyPasswordAndRole({
      identifier: "env-user",
      password: "nope",
      selectedRole: "ADMIN",
      user: {
        id: "u3",
        username: "env-user",
        email: "env-user@example.com",
        role: "SUPER_ADMIN",
        passwordHash,
      },
    });

    expect(ok).toBe(false);
  });
});
