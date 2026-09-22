import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";
import { GalleryManager } from "@/components/admin/gallery-manager";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const session = await getServerSession(authOptions);
  return (
    <AdminShell session={session}>
      <GalleryManager />
    </AdminShell>
  );
}
