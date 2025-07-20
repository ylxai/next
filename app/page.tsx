import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Photo Studio</h1>
          <p className="text-gray-600">Web fotografi professional</p>
        </div>
        
        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full" variant="default">
              Login
            </Button>
          </Link>
          
          <Link href="/admin/dashboard" className="block">
            <Button className="w-full" variant="outline">
              Admin Dashboard
            </Button>
          </Link>
          
          <Link href="/setup-admin" className="block">
            <Button className="w-full" variant="secondary">
              Setup Admin (Pertama Kali)
            </Button>
          </Link>
          
          <Link href="/debug-auth" className="block">
            <Button className="w-full" variant="ghost" size="sm">
              🔍 Debug Auth (Developer)
            </Button>
          </Link>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          Sistem manajemen foto studio modern
        </div>
      </div>
    </div>
  );
}