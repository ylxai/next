import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit").max(15, "Nomor telepon maksimal 15 digit"),
  company: z.string().max(100, "Nama perusahaan maksimal 100 karakter").optional().or(z.literal("")),
  address: z.string().max(300, "Alamat maksimal 300 karakter").optional().or(z.literal("")),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateClientSchema = createClientSchema.extend({
  id: z.string().uuid("Client ID tidak valid"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// Client status options
export const clientStatusOptions = [
  { value: "active", label: "Aktif", color: "green" },
  { value: "inactive", label: "Tidak Aktif", color: "gray" },
] as const;