import { createClient } from '@/app/lib/supabase/server';
import { Button } from '@/app/components/ui/button';  
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UserIcon, PhoneIcon, MailIcon, BuildingIcon, MapPinIcon, CalendarIcon, StickyNoteIcon } from 'lucide-react';

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch client data
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !client) {
    notFound();
  }

  // Fetch related events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, status, event_type')
    .eq('client_id', id)
    .order('date', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Klien</h1>
          <p className="text-gray-600">Informasi lengkap klien dan riwayat event</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href="/admin/clients">Kembali</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/clients/${id}/edit`}>Edit Klien</Link>
          </Button>
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Informasi Klien</h2>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            client.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {client.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                <p className="text-lg font-semibold">{client.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Nomor Telepon</p>
                <p className="text-gray-900">{client.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MailIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{client.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <BuildingIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Perusahaan</p>
                <p className="text-gray-900">{client.company || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Alamat</p>
                <p className="text-gray-900">{client.address || '-'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Terdaftar</p>
                <p className="text-gray-900">
                  {new Date(client.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long', 
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start space-x-3">
              <StickyNoteIcon className="h-5 w-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Catatan</p>
                <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Events */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Riwayat Event</h2>
          <Button asChild>
            <Link href={`/admin/events/create?client_id=${id}`}>Buat Event Baru</Link>
          </Button>
        </div>

        {events && events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4">Judul Event</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{event.title}</td>
                    <td className="py-3 px-4 capitalize">{event.event_type}</td>
                    <td className="py-3 px-4">
                      {new Date(event.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.status === 'completed' ? 'bg-green-100 text-green-800' :
                        event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                        event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status === 'completed' ? 'Selesai' :
                         event.status === 'ongoing' ? 'Berlangsung' :
                         event.status === 'scheduled' ? 'Terjadwal' :
                         event.status === 'cancelled' ? 'Dibatalkan' :
                         'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/events/${event.id}`}>Detail</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12V11m0 0l4-4m-4 4l-4-4m4 4v8a4 4 0 11-8 0v-4" />
            </svg>
            <p className="text-gray-500">Belum ada event untuk klien ini</p>
            <p className="text-sm text-gray-400 mt-1">
              Buat event baru untuk klien ini dengan tombol di atas
            </p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Event</p>
              <p className="text-2xl font-semibold text-gray-900">{events?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Event Selesai</p>
              <p className="text-2xl font-semibold text-gray-900">
                {events?.filter(e => e.status === 'completed').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Event Mendatang</p>
              <p className="text-2xl font-semibold text-gray-900">
                {events?.filter(e => e.status === 'scheduled').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}