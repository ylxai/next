import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3, "Judul event minimal 3 karakter").max(100, "Judul event maksimal 100 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(1000, "Deskripsi maksimal 1000 karakter"),
  date: z.string().min(1, "Tanggal event wajib diisi"),
  start_time: z.string().min(1, "Waktu mulai wajib diisi"),
  end_time: z.string().min(1, "Waktu selesai wajib diisi"),
  location: z.string().min(3, "Lokasi minimal 3 karakter").max(200, "Lokasi maksimal 200 karakter"),
  event_type: z.enum(["wedding", "birthday", "corporate", "graduation", "engagement", "family", "other"], {
    errorMap: () => ({ message: "Pilih tipe event yang valid" })
  }),
  max_participants: z.number().min(1, "Minimal 1 peserta").max(1000, "Maksimal 1000 peserta"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  client_id: z.string().uuid("Client ID tidak valid").optional().or(z.literal("")),
  client_name: z.string().min(2, "Nama klien minimal 2 karakter").max(100, "Nama klien maksimal 100 karakter").optional().or(z.literal("")),
  client_email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  client_phone: z.string().min(8, "Nomor telepon minimal 8 digit").max(15, "Nomor telepon maksimal 15 digit").optional().or(z.literal("")),
  access_code: z.string().min(4, "Kode akses minimal 4 karakter").max(20, "Kode akses maksimal 20 karakter").optional().or(z.literal("")),
  status: z.enum(["draft", "scheduled", "ongoing", "completed", "cancelled"], {
    errorMap: () => ({ message: "Pilih status yang valid" })
  }).default("draft"),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional().or(z.literal("")),
  is_public: z.boolean().default(false),
  requires_approval: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid("Event ID tidak valid"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// Event type options for dropdown
export const eventTypeOptions = [
  { value: "wedding", label: "Pernikahan" },
  { value: "birthday", label: "Ulang Tahun" },
  { value: "corporate", label: "Corporate Event" },
  { value: "graduation", label: "Wisuda" },
  { value: "engagement", label: "Lamaran" },
  { value: "family", label: "Family Portrait" },
  { value: "other", label: "Lainnya" },
] as const;

// Event status options
export const eventStatusOptions = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "scheduled", label: "Terjadwal", color: "blue" },
  { value: "ongoing", label: "Sedang Berlangsung", color: "yellow" },
  { value: "completed", label: "Selesai", color: "green" },
  { value: "cancelled", label: "Dibatalkan", color: "red" },
] as const;