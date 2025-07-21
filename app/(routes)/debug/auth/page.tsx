import { AuthDebug } from '@/app/components/debug/auth-debug';

export const dynamic = 'force-dynamic';

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthDebug />
    </div>
  );
}