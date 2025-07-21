import { EventForm } from "@/app/components/admin/event-form";

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <EventForm mode="edit" eventId={id} />
      </div>
    </div>
  );
}