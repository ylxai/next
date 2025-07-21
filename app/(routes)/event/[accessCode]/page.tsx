import Link from 'next/link';   
import { useRouter } from 'next/navigation';  
import { createClient } from '@/app/lib/supabase/server';
import { Button } from '@/app/components/ui/button';
import { QRCode } from '@/app/components/ui/qr-code';

import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, DollarSignIcon } from 'lucide-react';
import { notFound } from 'next/navigation';

interface EventAccessPageProps {
  params: Promise<{
    accessCode: string;
  }>;
}

export default async function EventAccessPage({ params }: EventAccessPageProps) {
  const { accessCode } = await params;
  const supabase = await createClient();

  // Fetch event by access code
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      clients (
        name,
        email,
        phone
      )
    `)
    .eq('access_code', accessCode)
    .single();

  if (error || !event) {
    notFound();
  }

  // Format date and time
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Terbuka';
      case 'draft':
        return 'Draft';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Photo Studio</h1>
              <p className="text-gray-600">Event Gallery Access</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
              {getStatusText(event.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h2>
            {event.description && (
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            )}
          </div>

          {/* Event Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <CalendarIcon className="h-5 w-5 mr-3 text-blue-500" />
                <div>
                  <p className="font-medium">Tanggal</p>
                  <p className="text-sm text-gray-600">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <ClockIcon className="h-5 w-5 mr-3 text-green-500" />
                <div>
                  <p className="font-medium">Waktu</p>
                  <p className="text-sm text-gray-600">
                    {event.start_time} - {event.end_time} WIB
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <MapPinIcon className="h-5 w-5 mr-3 text-red-500" />
                <div>
                  <p className="font-medium">Lokasi</p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {event.max_participants && (
                <div className="flex items-center text-gray-700">
                  <UsersIcon className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="font-medium">Maksimal Peserta</p>
                    <p className="text-sm text-gray-600">{event.max_participants} orang</p>
                  </div>
                </div>
              )}

              {event.price && (
                <div className="flex items-center text-gray-700">
                  <DollarSignIcon className="h-5 w-5 mr-3 text-yellow-500" />
                  <div>
                    <p className="font-medium">Harga</p>
                    <p className="text-sm text-gray-600">{formatPrice(event.price)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center text-gray-700">
                <div className="w-5 h-5 mr-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <div>
                  <p className="font-medium">Tipe Event</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {event.event_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Galeri Foto</h3>
          
          {event.status === 'completed' ? (
            <div className="text-center py-8">
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-green-900 mb-2">
                  Foto Event Tersedia!
                </h4>
                <p className="text-green-700 mb-4">
                  Event sudah selesai dan foto-foto sudah tersedia untuk dilihat dan didownload.
                </p>
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Lihat & Download Foto
                </Button>
              </div>
            </div>
          ) : event.status === 'published' ? (
            <div className="text-center py-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-blue-900 mb-2">
                  Event Belum Dimulai
                </h4>
                <p className="text-blue-700 mb-4">
                  Foto-foto akan tersedia setelah event selesai dilaksanakan.
                </p>
                <p className="text-sm text-blue-600">
                  Simpan halaman ini atau bookmark untuk mengakses foto nanti.
                </p>
              </div>
            </div>
          ) : event.status === 'cancelled' ? (
            <div className="text-center py-8">
              <div className="bg-red-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-red-900 mb-2">
                  Event Dibatalkan
                </h4>
                <p className="text-red-700">
                  Event ini telah dibatalkan. Silakan hubungi penyelenggara untuk informasi lebih lanjut.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Event Belum Dipublikasi
                </h4>
                <p className="text-gray-700">
                  Event ini masih dalam tahap persiapan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        {event.clients && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Informasi Kontak</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{event.clients.name}</p>
                <p className="text-gray-600">{event.clients.email}</p>
                {event.clients.phone && (
                  <p className="text-gray-600">{event.clients.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Code for sharing */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <QRCode
            text={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/event/${accessCode}`}
            title="Bagikan Event Ini"
            size={150}
            downloadFilename={`event-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`}
            alt={`QR Code untuk event ${event.title}`}
            className="text-center"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            © 2024 Photo Studio. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}