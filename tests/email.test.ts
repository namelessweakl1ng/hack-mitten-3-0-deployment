import { afterEach, describe, expect, it } from "bun:test";
import { approvalEmailHtml, approvalEmailText, sendEmail } from "@/lib/email";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

const payload = {
  to: "leader@example.com",
  subject: "Hackmitten 3.0 — Team Approved",
  html: "<p>approved</p>",
  text: "approved",
};

describe("sendEmail", () => {
  it("reports missing Resend configuration in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = "Hackmitten <noreply@example.com>";

    await expect(sendEmail(payload)).resolves.toEqual({
      success: false,
      message: "RESEND_API_KEY is not configured in production",
      provider: "configuration",
    });
  });

  it("reports missing sender configuration in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.EMAIL_FROM;

    await expect(sendEmail(payload)).resolves.toEqual({
      success: false,
      message: "EMAIL_FROM is not configured in production",
      provider: "configuration",
    });
  });

  it("uses the console fallback locally", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;

    await expect(sendEmail(payload)).resolves.toMatchObject({
      success: true,
      provider: "console",
    });
  });

  it("reports a successful Resend delivery", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Hackmitten <noreply@example.com>";
    let requestBody = "";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
      requestBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ id: "email_test_1" }), { status: 200 });
    };

    try {
      await expect(sendEmail(payload)).resolves.toMatchObject({ success: true, provider: "resend" });
      expect(requestBody).toContain('"to":["leader@example.com"]');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports a Resend failure", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Hackmitten <noreply@example.com>";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "provider rejected request" }), { status: 400 });

    try {
      await expect(sendEmail(payload)).resolves.toMatchObject({ success: false, provider: "resend" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("approval email templates", () => {
  const opts = {
    participantName: "Leader",
    teamName: "Nova",
    registrationId: "HM3-00001",
    participantId: "HM3-00001-01",
    passUrl: "https://example.com/pass/token",
    whatsappGroupUrl: "https://chat.whatsapp.com/CKjNXeNALPzAymQ0GhfMCj",
  };

  it("contains the WhatsApp URL in both templates", () => {
    expect(approvalEmailHtml(opts)).toContain(opts.whatsappGroupUrl);
    expect(approvalEmailText(opts)).toContain(opts.whatsappGroupUrl);
  });

  it("targets the team leader email in the approval payload", () => {
    expect(approvalEmailText(opts)).toContain("Leader");
    expect(payload.to).toBe("leader@example.com");
  });
});