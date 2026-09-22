import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";
import { CoordinatorManager } from "@/components/admin/coordinator-manager";

export const dynamic = "force-dynamic";

export default async function AdminCoordinatorsPage() {
  const session = await getServerSession(authOptions);
  return (
    <AdminShell session={session}>
      <CoordinatorManager />
    </AdminShell>
  );
}
