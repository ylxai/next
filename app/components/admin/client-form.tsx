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
  createClientSchema, 
  updateClientSchema, 
  clientStatusOptions,
  type CreateClientInput
} from "@/app/lib/validations/client";
import { createClient } from "@/app/lib/supabase/client";
import { UserIcon, PhoneIcon, BuildingIcon } from "lucide-react";

interface ClientFormProps {
  mode: "create" | "edit";
  clientId?: string;
  initialData?: Partial<CreateClientInput>;
  onSuccess?: () => void;
}

interface FormData extends CreateClientInput {
  id?: string;
}

export function ClientForm({ mode, clientId, initialData, onSuccess }: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === "edit");
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const schema = mode === "edit" ? updateClientSchema : createClientSchema;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ 
    resolver: zodResolver(schema) as any,
    defaultValues: {
      status: "active",
      ...initialData,
    },
  });

  // Load client data for edit mode
  useEffect(() => {
    const loadClientData = async () => {
      if (mode !== "edit" || !clientId) return;

      try {
        setIsLoadingData(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) {
          setMessage({ type: 'error', text: 'Gagal memuat data klien: ' + error.message });
          return;
        }

        if (data) {
          reset(data);
        }
      } catch (error) {
        console.error('Error loading client:', error);
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat data klien' });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadClientData();
  }, [mode, clientId, supabase, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setMessage(null);

      // Clean up empty strings to null for optional fields
      const clientData = {
        ...data,
        email: data.email || null,
        company: data.company || null,
        address: data.address || null,
        notes: data.notes || null,
      };

      let response;
      
      if (mode === "create") {
        response = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();
      } else {
        response = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', clientId)
          .select()
          .single();
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      setMessage({ 
        type: 'success', 
        text: mode === "create" ? 'Klien berhasil dibuat!' : 'Klien berhasil diupdate!' 
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset form if creating new client
      if (mode === "create") {
        reset();
      }

      // Refresh the page data
      router.refresh();

    } catch (error) {
      console.error('Error saving client:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan klien' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memuat data klien...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      {mode === "edit" && (
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Klien</h3>
          <p className="mt-1 text-sm text-gray-600">Perbarui informasi klien</p>
        </div>
      )}

      {/* Alert Messages */}
      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-4 w-4 mr-2 text-gray-600" />
          Informasi Dasar
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Nama lengkap klien"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              {clientStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <PhoneIcon className="h-4 w-4 mr-2 text-gray-600" />
          Informasi Kontak
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <Label htmlFor="phone">Nomor Telepon *</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="081234567890"
              type="tel"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@contoh.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <BuildingIcon className="h-4 w-4 mr-2 text-gray-600" />
          Informasi Tambahan
        </h4>
        
        <div className="space-y-4">
          {/* Company */}
          <div>
            <Label htmlFor="company">Perusahaan</Label>
            <Input
              id="company"
              {...register("company")}
              placeholder="Nama perusahaan (opsional)"
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              {...register("address")}
              placeholder="Alamat lengkap klien (opsional)"
              rows={2}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Catatan tambahan tentang klien (opsional)"
              rows={3}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {mode === "edit" && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === "create" ? "Membuat..." : "Menyimpan..."}
            </span>
          ) : (
            mode === "create" ? "Buat Klien" : "Simpan Perubahan"
          )}
        </Button>
      </div>
    </form>
  );
}