import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";
import { WinnerManager } from "@/components/admin/winner-manager";

export const dynamic = "force-dynamic";

export default async function AdminWinnersPage() {
  const session = await getServerSession(authOptions);
  return (
    <AdminShell session={session}>
      <WinnerManager />
    </AdminShell>
  );
}
