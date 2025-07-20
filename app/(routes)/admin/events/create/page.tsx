import { CreateEventForm } from "@/app/components/admin/create-event-form"; 

export default function CreateEventPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Event</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <CreateEventForm />
      </div>
    </div>
  );
} 