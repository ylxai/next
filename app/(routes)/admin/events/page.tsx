import { Button } from "@/app/components/ui/button";
import { createClient } from "@/app/lib/supabase/server"; 
import Link from "next/link";
import { formatDateWithMonth } from "@/app/lib/utils/date";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <Button asChild>
          <Link href="/admin/events/create">Create New Event</Link>
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Event List</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Access Code</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events && events.length > 0 ? (
                events.map((event) => (
                  <tr key={event.id} className="border-b">
                    <td className="py-3 px-4">{event.title}</td>
                    <td className="py-3 px-4">
                      {formatDateWithMonth(event.date)}
                    </td>
                    <td className="py-3 px-4">{event.access_code}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/events/${event.id}`}>View</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 