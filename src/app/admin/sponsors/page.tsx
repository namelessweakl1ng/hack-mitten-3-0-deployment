import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";
import { SponsorManager } from "@/components/admin/sponsor-manager";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage() {
  const session = await getServerSession(authOptions);
  return (
    <AdminShell session={session}>
      <SponsorManager />
    </AdminShell>
  );
}
