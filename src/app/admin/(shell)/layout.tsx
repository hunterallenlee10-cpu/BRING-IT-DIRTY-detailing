import { requireOwner } from "@/lib/auth";
import { automationFlags, ownerLeads } from "@/lib/adminData";
import { LeadsProvider } from "@/components/admin/LeadsProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  const leads = await ownerLeads();
  return (
    <LeadsProvider initial={leads} serverNow={new Date().toISOString()} mode={owner.mode} flags={automationFlags()} owner={owner.email}>
      <AdminShell>{children}</AdminShell>
    </LeadsProvider>
  );
}
