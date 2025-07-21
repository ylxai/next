import { Button } from "@/components/ui/button";
import { createClient } from "@/app/lib/supabase/server";
import Link from "next/link";
import { PhotoUploadSection } from "@/app/components/admin/photo-upload-section";

export default async function AdminPhotosPage() {
  const supabase = await createClient();
  
  // Get events for photo upload
  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, status")
    .order("date", { ascending: false });

  // Get recent photos
  const { data: photos } = await supabase
    .from("photos")
    .select(`
      *,
      events!inner(
        id,
        title,
        access_code
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Photo Management</h1>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href="/test-photo-upload">Test Upload</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/test-photo-validation">Diagnostics</Link>
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
        
        {events && events.length > 0 ? (
          <PhotoUploadSection events={events} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No events found. Create an event first to upload photos.</p>
            <Button asChild>
              <Link href="/admin/events/create">Create Event</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Recent Photos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Photos</h2>
        
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="border rounded-lg p-3">
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Preview</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate">{photo.original_filename}</p>
                  <p className="text-xs text-gray-500">{photo.events?.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      photo.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {photo.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {photo.is_featured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No photos uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{photos?.length || 0}</div>
            <div className="text-sm text-gray-500">Recent Photos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {photos?.filter(p => p.is_approved).length || 0}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {photos?.filter(p => !p.is_approved).length || 0}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {photos?.filter(p => p.is_featured).length || 0}
            </div>
            <div className="text-sm text-gray-500">Featured</div>
          </div>
        </div>
      </div>
    </div>
  );
}