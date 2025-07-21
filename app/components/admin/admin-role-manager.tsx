"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  setUserRole, 
  getAllUsersWithRoles, 
  isUserAdmin,
  getCurrentUserRole 
} from '@/app/lib/utils/admin-role-management';
import { UserIcon, ShieldIcon, AlertTriangleIcon, CheckIcon } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  last_sign_in_at?: string;
}

export function AdminRoleManager() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    checkAdminStatus();
    loadUsers();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const isAdmin = await isUserAdmin(supabase);
      const userRole = await getCurrentUserRole(supabase);
      setIsCurrentUserAdmin(isAdmin);
      setCurrentUserRole(userRole);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsersWithRoles(supabase);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({
        type: 'error',
        text: 'Gagal memuat daftar pengguna'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async () => {
    if (!email.trim()) {
      setMessage({
        type: 'error',
        text: 'Email harus diisi'
      });
      return;
    }

    try {
      setLoading(true);
      await setUserRole(supabase, email, role);
      setMessage({
        type: 'success',
        text: 'Peran berhasil diubah!'
      });
      setEmail('');
      setRole('user');
      await loadUsers(); // Refresh user list
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Gagal mengubah peran: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userEmail: string, newRole: 'admin' | 'user') => {
    try {
      setLoading(true);
      await setUserRole(supabase, userEmail, newRole);
      setMessage({
        type: 'success',
        text: `Peran ${userEmail} berhasil diubah menjadi ${newRole}`
      });
      await loadUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Gagal mengubah peran: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isCurrentUserAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-red-500" />
            Akses Ditolak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Anda tidak memiliki izin untuk mengakses halaman ini. 
              Hanya admin yang dapat mengelola peran pengguna.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Peran Anda saat ini: <Badge variant="outline">{currentUserRole}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Peran Admin</h1>
          <p className="text-gray-600">Kelola peran pengguna dalam sistem</p>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Set Role Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tetapkan Peran Pengguna</CardTitle>
          <CardDescription>
            Masukkan email pengguna dan pilih peran yang ingin diberikan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Pengguna</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Peran</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Button 
            onClick={handleSetRole} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Memproses...' : 'Tetapkan Peran'}
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Semua pengguna yang terdaftar dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="text-center py-4">Memuat daftar pengguna...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Tidak ada pengguna ditemukan</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={user.role === 'admin' ? 'default' : 'outline'}
                      className={user.role === 'admin' ? 'bg-blue-100 text-blue-800' : ''}
                    >
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                    
                    {user.role === 'admin' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleChange(user.email, 'user')}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        Hapus Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleChange(user.email, 'admin')}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Jadikan Admin
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}