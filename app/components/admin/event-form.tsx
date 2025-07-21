"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { 
  createEventSchema, 
  updateEventSchema, 
  eventTypeOptions, 
  eventStatusOptions,
  type CreateEventInput
} from "@/app/lib/validations/event";
import { createClient } from "@/app/lib/supabase/client";
import { CalendarIcon, ClockIcon, MapPinIcon, DollarSignIcon, KeyIcon } from "lucide-react";

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: Partial<CreateEventInput>;
}

type FormData = CreateEventInput;

export function EventForm({ mode, eventId, initialData }: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === "edit");
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [clients, setClients] = useState<Array<{id: string; name: string; email: string}>>([]);
  const router = useRouter();
  const supabase = createClient();

  const schema = mode === "edit" ? updateEventSchema : createEventSchema;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      status: "draft",
      is_public: false,
      requires_approval: false,
      max_participants: 50,
      price: 0,
      ...initialData,
    },
  });

  // Generate access code
  const generateAccessCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setValue("access_code", code);
  };

  // Load clients for dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email')
          .order('name');
        
        if (!error && data) {
          setClients(data);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };

    loadClients();
  }, [supabase]);

  // Load event data for edit mode
  useEffect(() => {
    const loadEventData = async () => {
      if (mode !== "edit" || !eventId) return;

      try {
        setIsLoadingData(true);
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) {
          setMessage({ type: 'error', text: 'Gagal memuat data event: ' + error.message });
          return;
        }

        if (data) {
          // Convert date format if needed
          const formattedData = {
            ...data,
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
            max_participants: Number(data.max_participants) || 50,
            price: Number(data.price) || 0,
          };
          reset(formattedData);
        }
      } catch (error) {
        console.error('Error loading event:', error);
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat data event' });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadEventData();
  }, [mode, eventId, supabase, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setMessage(null);

      console.log('Form data submitted:', data); // Debug log

      // Clean and prepare the data
      const eventData = {
        title: data.title.trim(),
        description: data.description.trim(),
        event_type: data.event_type,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location.trim(),
        max_participants: Number(data.max_participants) || 50,
        price: Number(data.price) || 0,
        status: data.status || 'draft',
        is_public: Boolean(data.is_public),
        requires_approval: Boolean(data.requires_approval),
        
        // Handle optional fields - convert empty strings to null
        client_id: data.client_id || null,
        client_name: data.client_name?.trim() || null,
        client_email: data.client_email?.trim() || null,
        client_phone: data.client_phone?.trim() || null,
        notes: data.notes?.trim() || null,
        access_code: data.access_code?.trim() || Math.random().toString(36).substring(2, 8).toUpperCase(),
      };

      console.log('Prepared event data:', eventData); // Debug log

      let response;
      
      if (mode === "create") {
        response = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single();
      } else {
        response = await supabase
          .from('events')
          .update(eventData)
          .eq('id', eventId)
          .select()
          .single();
      }

      console.log('Supabase response:', response); // Debug log

      if (response.error) {
        console.error('Supabase error:', response.error); // Debug log
        throw new Error(response.error.message);
      }

      // Defensive check for response data
      if (!response.data || !response.data.id) {
        console.error('Invalid response data:', response);
        throw new Error('Server returned invalid data');
      }

      setMessage({ 
        type: 'success', 
        text: mode === "create" ? 'Event berhasil dibuat!' : 'Event berhasil diupdate!' 
      });

      // Redirect after success
      setTimeout(() => {
        router.push(`/admin/events/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error saving event:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        mode,
        eventId,
        // eventData is not defined in this scope; remove or fix reference
      });

      // Improved error handling
      let errorMessage = 'Terjadi kesalahan saat menyimpan event';
      if (error instanceof Error) {
        // Handle specific database errors
        if (error.message.includes('updated_at')) {
          errorMessage = 'Database trigger error. Please contact administrator to run the database fix script.';
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Data referensi tidak valid. Pastikan client yang dipilih masih aktif.';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Kode akses sudah digunakan. Silakan gunakan kode akses yang berbeda.';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Data tidak memenuhi kriteria validasi. Periksa kembali input Anda.';
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Klien yang dipilih tidak valid. Silakan pilih klien lain atau kosongkan.';
        } else if (error.message.includes('duplicate key value')) {
          errorMessage = 'Kode akses sudah digunakan. Silakan generate kode akses baru.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Anda tidak memiliki izin untuk membuat event. Pastikan Anda sudah login sebagai admin.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memuat data event...</p>
        </div>
      </div>
    );
  }

  return (  
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">    
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === "create" ? "Buat Event Baru" : "Edit Event"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {mode === "create" 
            ? "Isi informasi lengkap untuk membuat event fotografi baru" 
            : "Perbarui informasi event"
          }
        </p>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
            Informasi Dasar
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">Judul Event *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Contoh: Wedding Photo Session - John & Jane"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Event Type */}
            <div>
              <Label htmlFor="event_type">Tipe Event *</Label>
              <Select id="event_type" {...register("event_type")} placeholder="Pilih tipe event">
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.event_type && (
                <p className="mt-1 text-sm text-red-600">{errors.event_type.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                {eventStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Deskripsi *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Deskripsi detail tentang event, tema, requirements, dll."
                rows={4}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
            Tanggal & Waktu
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <Label htmlFor="date">Tanggal *</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <Label htmlFor="start_time">Waktu Mulai *</Label>
              <Input
                id="start_time"
                type="time"
                {...register("start_time")}
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <Label htmlFor="end_time">Waktu Selesai *</Label>
              <Input
                id="end_time"
                type="time"
                {...register("end_time")}
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location & Participants */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-gray-600" />
            Lokasi & Peserta
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <Label htmlFor="location">Lokasi *</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Alamat lengkap venue atau studio"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            {/* Max Participants */}
            <div>
              <Label htmlFor="max_participants">Maksimal Peserta *</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                max="1000"
                {...register("max_participants", { valueAsNumber: true })}
                placeholder="Jumlah maksimal peserta"
              />
              {errors.max_participants && (
                <p className="mt-1 text-sm text-red-600">{errors.max_participants.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Client & Pricing */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSignIcon className="h-5 w-5 mr-2 text-gray-600" />
            Klien & Harga
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <div>
              <Label htmlFor="client_id">Klien (Opsional)</Label>
              <Select id="client_id" {...register("client_id")} placeholder="Pilih klien yang ada">
                <option value="">Klien baru / tidak terdaftar</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </Select>
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Harga (Rp) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1000"
                {...register("price", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* New Client Info (if no client selected) */}
            {!watch("client_id") && (
              <>
                <div>
                  <Label htmlFor="client_name">Nama Klien</Label>
                  <Input
                    id="client_name"
                    {...register("client_name")}
                    placeholder="Nama lengkap klien"
                  />
                  {errors.client_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_email">Email Klien</Label>
                  <Input
                    id="client_email"
                    type="email"
                    {...register("client_email")}
                    placeholder="email@contoh.com"
                  />
                  {errors.client_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_phone">Nomor Telepon Klien</Label>
                  <Input
                    id="client_phone"
                    {...register("client_phone")}
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.client_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_phone.message}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Access & Settings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <KeyIcon className="h-5 w-5 mr-2 text-gray-600" />
            Akses & Pengaturan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Access Code */}
            <div>
              <Label htmlFor="access_code">Kode Akses</Label>
              <div className="flex gap-2">
                <Input
                  id="access_code"
                  {...register("access_code")}
                  placeholder="Akan digenerate otomatis"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generateAccessCode}
                  disabled={isLoading}
                >
                  Generate
                </Button>
              </div>
              {errors.access_code && (
                <p className="mt-1 text-sm text-red-600">{errors.access_code.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Kode untuk akses galeri foto event
              </p>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  {...register("is_public")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_public" className="text-sm font-normal">
                  Event publik (dapat dilihat tanpa login)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requires_approval"
                  {...register("requires_approval")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="requires_approval" className="text-sm font-normal">
                  Memerlukan persetujuan untuk mengakses
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Catatan Tambahan
          </h3>
          
          <div>
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Catatan internal, special requests, equipment needed, dll."
              rows={3}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === "create" ? "Membuat..." : "Menyimpan..."}
            </span>
          ) : (
            mode === "create" ? "Buat Event" : "Simpan Perubahan"
          )}
        </Button>
      </div>
    </form>
  );
}