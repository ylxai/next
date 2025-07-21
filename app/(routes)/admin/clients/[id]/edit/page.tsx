import { ClientForm } from "@/app/components/admin/client-form";

interface EditClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <ClientForm mode="edit" clientId={id} />
      </div>
    </div>
  );
}