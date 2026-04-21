
import { Metadata } from 'next';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import AuditLogsClient from "@/app/audit-logs/AuditLogsClient";
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Audit Logs | GMS SaaS',
  description: 'View system audit logs and activity history',
};

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Strict Access Control: Only Owner and Super Admin
  const role = (session.user as any)?.role;
  if (role !== 'owner' && role !== 'super_admin' && role !== 'gym_owner') {
     redirect("/dashboard");
  }

  return (
    <Suspense fallback={<div className="text-primary font-black italic animate-pulse tracking-widest uppercase text-xs">Loading Audit Logs...</div>}>
      <AuditLogsClient />
    </Suspense>
  );
}
