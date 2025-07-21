"use client";

import { useState } from "react";
import { PhotoUpload } from "./photo-upload";
import { DateOnly } from "@/app/components/ui/date-display";

interface PhotoUploadSectionProps {
  events: Array<{
    id: string;
    title: string;
    date: string;
    status: string;
  }>;
}

export function PhotoUploadSection({ events }: PhotoUploadSectionProps) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload to Event:
        </label>
        <select 
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} - {event.date} ({event.status})
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <PhotoUpload
          eventId={selectedEventId}
          onUploadComplete={(results) => {
            console.log('Upload completed:', results);
            if (results.successful.length > 0) {
              // Show success message and refresh
              alert(`Successfully uploaded ${results.successful.length} photos!`);
              window.location.reload();
            } else if (results.failed.length > 0) {
              alert(`Upload failed: ${results.failed[0]?.error || 'Unknown error'}`);
            }
          }}
          maxFiles={50}
        />
      )}
    </div>
  );
}