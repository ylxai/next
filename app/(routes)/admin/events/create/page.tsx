import { EventForm } from "@/app/components/admin/event-form";

export default function CreateEventPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <EventForm mode="create" />
      </div>
    </div>
  );
} 