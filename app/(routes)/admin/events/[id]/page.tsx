import { createClient } from '@/app/lib/supabase/server';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon, 
  DollarSignIcon, 
  KeyIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  BuildingIcon,
  EditIcon,
  QrCodeIcon,
  CameraIcon,
  FileTextIcon
} from 'lucide-react';
import { eventTypeOptions, eventStatusOptions } from '@/app/lib/validations/event';
import { EventStatusManager } from '@/app/components/admin/event-status-manager';
import { EventSharing } from '@/app/components/admin/event-sharing';

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch event data with client information
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Helper function to get event type label
  const getEventTypeLabel = (type: string) => {
    return eventTypeOptions.find(option => option.value === type)?.label || type;
  };

  // Helper function to get status info
  const getStatusInfo = (status: string) => {
    const statusOption = eventStatusOptions.find(option => option.value === status);
    return {
      label: statusOption?.label || status,
      color: statusOption?.color || 'gray'
    };
  };

  const statusInfo = getStatusInfo(event.status);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date and time
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-gray-600 mt-1">Detail lengkap event dan informasi klien</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href="/admin/events">Kembali ke Daftar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${id}/edit`}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Badge and Quick Actions */}
      <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
            statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
            statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
            statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusInfo.label}
          </span>
          <span className="text-lg font-medium text-gray-900">
            {getEventTypeLabel(event.event_type)}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
          <Button variant="outline" size="sm">
            <CameraIcon className="h-4 w-4 mr-2" />
            Galeri Foto
          </Button>
          <Button variant="outline" size="sm">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Download Info
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Event Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Informasi Event</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tanggal</p>
                    <p className="text-gray-900 font-medium">{formatDate(event.date)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Waktu</p>
                    <p className="text-gray-900">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Lokasi</p>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                </div>
              </div>

              {/* Participants & Pricing */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <UsersIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Maksimal Peserta</p>
                    <p className="text-gray-900 font-medium">{event.max_participants} orang</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSignIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Harga</p>
                    <p className="text-gray-900 font-semibold text-lg">{formatCurrency(event.price)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <KeyIcon className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kode Akses</p>
                    <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-sm inline-block">
                      {event.access_code}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Deskripsi</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Notes */}
            {event.notes && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Catatan</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {event.notes}
                </p>
              </div>
            )}

            {/* Settings */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Pengaturan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${event.is_public ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700">
                    {event.is_public ? 'Event Publik' : 'Event Privat'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${event.requires_approval ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700">
                    {event.requires_approval ? 'Perlu Persetujuan' : 'Akses Langsung'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Gallery Section (Placeholder) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Galeri Foto</h2>
              <Button variant="outline" size="sm">
                <CameraIcon className="h-4 w-4 mr-2" />
                Upload Foto
              </Button>
            </div>
            
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Belum ada foto untuk event ini</p>
              <p className="text-sm text-gray-400">Upload foto pertama untuk memulai galeri</p>
              <Button variant="outline" className="mt-4">
                Upload Foto Sekarang
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Informasi Klien</h2>
            
            {event.client ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{event.client.name}</h3>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/clients/${event.client.id}`}>
                      Lihat Profile
                    </Link>
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{event.client.phone}</span>
                  </div>
                  
                  {event.client.email && (
                    <div className="flex items-center space-x-3">
                      <MailIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{event.client.email}</span>
                    </div>
                  )}
                  
                  {event.client.company && (
                    <div className="flex items-center space-x-3">
                      <BuildingIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{event.client.company}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    Klien terdaftar sejak {new Date(event.client.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(event.client_name || event.client_email || event.client_phone) ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">
                      {event.client_name || 'Klien Tidak Terdaftar'}
                    </h3>
                    
                    {event.client_phone && (
                      <div className="flex items-center space-x-3">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{event.client_phone}</span>
                      </div>
                    )}
                    
                    {event.client_email && (
                      <div className="flex items-center space-x-3">
                        <MailIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{event.client_email}</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Daftarkan sebagai Klien
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Tidak ada informasi klien</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Event Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Statistik Event</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dibuat</span>
                <span className="text-sm font-medium">
                  {new Date(event.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Terakhir diupdate</span>
                <span className="text-sm font-medium">
                  {new Date(event.updated_at).toLocaleDateString('id-ID')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total foto</span>
                <span className="text-sm font-medium">0 foto</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">QR Code downloads</span>
                <span className="text-sm font-medium">0 downloads</span>
              </div>
            </div>
          </div>

          {/* Event Status Manager */}
          <EventStatusManager 
            eventId={id}
            currentStatus={event.status}
            eventTitle={event.title}
          />

          {/* Event Sharing */}
          <EventSharing 
            eventId={id}
            accessCode={event.access_code}
            eventTitle={event.title}
            isPublic={event.is_public}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Aksi Cepat</h2>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/events/${id}/edit`}>
                  <EditIcon className="h-4 w-4 mr-3" />
                  Edit Event
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <CameraIcon className="h-4 w-4 mr-3" />
                Kelola Foto
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <FileTextIcon className="h-4 w-4 mr-3" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}