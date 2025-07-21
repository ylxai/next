"use client";

export const dynamic = 'force-dynamic';

import { AdminRoleManager } from '@/app/components/admin/admin-role-manager';

export default function AdminRolesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <AdminRoleManager />
      </div>
    </div>
  );
}