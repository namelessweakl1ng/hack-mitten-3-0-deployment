import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";

/**
 * GET /api/admin/export
 * Returns CSV of all teams + members + payment summary.
 */
export async function GET() {
  try {
    await requirePermission("export:data");

    const teams = await db.team.findMany({
      include: {
        members: true,
        payment: { include: { verifiedBy: { select: { email: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    const rows: string[][] = [
      [
        "teamName",
        "registrationId",
        "status",
        "college",
        "member1_name",
        "member1_email",
        "member1_phone",
        "member2_name",
        "member2_email",
        "member2_phone",
        "member3_name",
        "member3_email",
        "member3_phone",
        "member4_name",
        "member4_email",
        "member4_phone",
        "paymentStatus",
        "transactionId",
        "paymentVerifiedBy",
        "paymentVerifiedAt",
        "createdAt",
      ],
    ];

    for (const t of teams) {
      const row: string[] = [
        csv(t.teamName),
        csv(t.registrationId ?? ""),
        csv(t.status),
        csv(t.college ?? ""),
      ];
      for (let i = 0; i < 4; i++) {
        const m = t.members[i];
        if (m) {
          row.push(csv(m.fullName), csv(m.email), csv(m.phone));
        } else {
          row.push("", "", "");
        }
      }
      row.push(
        csv(t.payment?.status ?? "NONE"),
        csv(t.payment?.transactionId ?? ""),
        csv(t.payment?.verifiedBy?.email ?? ""),
        csv(t.payment?.verifiedAt?.toISOString() ?? ""),
        csv(t.createdAt.toISOString()),
      );
      rows.push(row);
    }

    const csvText = rows.map((r) => r.join(",")).join("\n");
    return new Response(csvText, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hackmitten-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

function csv(s: string | null | undefined): string {
  if (s == null) return "";
  const needs = /[",\n\r]/.test(s);
  return needs ? `"${s.replace(/"/g, '""')}"` : s;
}
