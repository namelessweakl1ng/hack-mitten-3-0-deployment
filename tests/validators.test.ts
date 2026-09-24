/**
 * Backend validation tests — run with: bun test tests/validators.test.ts
 *
 * Validates the zod registration schema and food check-in schema.
 */
import { describe, it, expect } from "bun:test";
import {
  registrationSchema,
  normalizeRegistrationMembers,
  paymentSubmissionSchema,
  foodCheckInSchema,
  rejectionSchema,
} from "../src/lib/validators";

function validMember(name: string, email: string, _isLeader = false) {
  return {
    fullName: name,
    email,
    phone: "9876543210",
    college: "Test College",
  };
}

function teamWithLeader(members: ReturnType<typeof validMember>[]) {
  return members;
}

describe("registrationSchema", () => {
  it("accepts a valid 3-member team with one leader", () => {
    const res = registrationSchema.safeParse({
      teamName: "NOVA",
      members: teamWithLeader([
        validMember("Alice", "alice@gmail.com", true),
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(true);
  });

  it("accepts a valid 4-member team with one leader", () => {
    const res = registrationSchema.safeParse({
      teamName: "NOVA",
      members: teamWithLeader([
        validMember("Alice", "alice@gmail.com", true),
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
        validMember("Dan", "dan@gmail.com"),
      ]),
    });
    expect(res.success).toBe(true);
  });

  it("rejects a 2-member team (minimum 3)", () => {
    const res = registrationSchema.safeParse({
      teamName: "TOOFEW",
      members: teamWithLeader([
        validMember("Alice", "alice@gmail.com", true),
        validMember("Bob", "bob@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });

  it("rejects a 5-member team (maximum 4)", () => {
    const res = registrationSchema.safeParse({
      teamName: "TOOMANY",
      members: teamWithLeader([
        validMember("A", "a@gmail.com", true),
        validMember("B", "b@gmail.com"),
        validMember("C", "c@gmail.com"),
        validMember("D", "d@gmail.com"),
        validMember("E", "e@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const res = registrationSchema.safeParse({
      teamName: "BAD",
      members: teamWithLeader([
        validMember("Alice", "not-an-email", true),
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });

  it("rejects duplicate emails within team", () => {
    const res = registrationSchema.safeParse({
      teamName: "DUP",
      members: teamWithLeader([
        validMember("Alice", "same@gmail.com", true),
        validMember("Bob", "same@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });

  it("rejects short phone", () => {
    const res = registrationSchema.safeParse({
      teamName: "BADPHONE",
      members: teamWithLeader([
        { ...validMember("Alice", "alice@gmail.com", true), phone: "123" },
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });

  it.each([
    ["6", "6123456789"],
    ["7", "7123456789"],
    ["8", "8123456789"],
    ["9", "9123456789"],
  ])("accepts a 10-digit Indian mobile beginning with %s", (_prefix, phone) => {
    const res = registrationSchema.safeParse({
      teamName: "VALIDPHONE",
      members: teamWithLeader([
        validMember("Alice", "alice@gmail.com", true),
        { ...validMember("Bob", "bob@gmail.com"), phone },
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(true);
  });

  it.each([
    ["0", "0123456789"],
    ["1-5", "5123456789"],
    ["9 digits", "987654321"],
    ["11 digits", "98765432101"],
    ["alphabetic characters", "abcdefghij"],
    ["mixed characters", "98765abcde"],
  ])("rejects invalid phone: %s", (_case, phone) => {
    const res = registrationSchema.safeParse({
      teamName: "INVALIDPHONE",
      members: [
        validMember("Alice", "alice@gmail.com", true),
        { ...validMember("Bob", "bob@gmail.com"), phone },
        validMember("Carol", "carol@gmail.com"),
      ],
    });
    expect(res.success).toBe(false);
  });

  it("rejects team name with invalid characters", () => {
    const res = registrationSchema.safeParse({
      teamName: "Bad@Team!",
      members: teamWithLeader([
        validMember("Alice", "alice@gmail.com", true),
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });

  it("rejects empty member full name", () => {
    const res = registrationSchema.safeParse({
      teamName: "OK",
      members: teamWithLeader([
        { ...validMember("", "alice@gmail.com", true) },
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });

  it("ignores a client-controlled leader flag", () => {
    const res = registrationSchema.safeParse({
      teamName: "NOLEADER",
      members: [
        validMember("Alice", "alice@gmail.com"),
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ],
    });
    expect(res.success).toBe(true);
  });

  it("normalizes the first member as the only leader", () => {
    const res = registrationSchema.safeParse({
      teamName: "TWOLEADERS",
      members: [
        validMember("Alice", "alice@gmail.com", true),
        validMember("Bob", "bob@gmail.com", true),
        validMember("Carol", "carol@gmail.com"),
      ],
    });
    expect(res.success).toBe(true);
    if (res.success) {
      const members = normalizeRegistrationMembers(res.data.members);
      expect(members.map((member) => member.isLeader)).toEqual([true, false, false]);
    }
  });

  it("rejects team with missing college on any member", () => {
    const res = registrationSchema.safeParse({
      teamName: "NOCOLLEGE",
      members: teamWithLeader([
        { ...validMember("Alice", "alice@gmail.com", true), college: "" },
        validMember("Bob", "bob@gmail.com"),
        validMember("Carol", "carol@gmail.com"),
      ]),
    });
    expect(res.success).toBe(false);
  });
});

describe("paymentSubmissionSchema", () => {
  it("accepts valid transaction ID", () => {
    const res = paymentSubmissionSchema.safeParse({ transactionId: "TXN-ABCD-1234" });
    expect(res.success).toBe(true);
  });
  it("rejects too-short transaction ID", () => {
    const res = paymentSubmissionSchema.safeParse({ transactionId: "TX" });
    expect(res.success).toBe(false);
  });
  it("accepts transaction ID with spaces (UPI IDs can have various formats)", () => {
    const res = paymentSubmissionSchema.safeParse({ transactionId: "TXN with spaces" });
    expect(res.success).toBe(true);
  });
  it("rejects transaction ID that is too short", () => {
    const res = paymentSubmissionSchema.safeParse({ transactionId: "AB" });
    expect(res.success).toBe(false);
  });
});

describe("foodCheckInSchema", () => {
  it("accepts valid qrToken and mealId", () => {
    const res = foodCheckInSchema.safeParse({ qrToken: "abc123def456", mealId: "m1" });
    expect(res.success).toBe(true);
  });
  it("rejects short qrToken", () => {
    const res = foodCheckInSchema.safeParse({ qrToken: "abc", mealId: "m1" });
    expect(res.success).toBe(false);
  });
  it("rejects empty mealId", () => {
    const res = foodCheckInSchema.safeParse({ qrToken: "abc123def456", mealId: "" });
    expect(res.success).toBe(false);
  });
});

describe("rejectionSchema", () => {
  it("accepts a valid reason", () => {
    const res = rejectionSchema.safeParse({ reason: "Transaction not found" });
    expect(res.success).toBe(true);
  });
  it("rejects too-short reason", () => {
    const res = rejectionSchema.safeParse({ reason: "x" });
    expect(res.success).toBe(false);
  });
});
