"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/app/lib/supabase/client";
import { eventStatusOptions } from "@/app/lib/validations/event";
import { CheckCircleIcon, XCircleIcon, ClockIcon, PlayCircleIcon, PauseCircleIcon } from "lucide-react";

interface EventStatusManagerProps {
  eventId: string;
  currentStatus: string;
  eventTitle: string;
  onStatusUpdate?: (newStatus: string) => void;
}

export function EventStatusManager({ 
  eventId, 
  currentStatus, 
  eventTitle, 
  onStatusUpdate 
}: EventStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const updateStatus = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const { error } = await supabase
        .from('events')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        throw new Error(error.message);
      }

      setMessage({ 
        type: 'success', 
        text: `Status event berhasil diubah ke "${getStatusLabel(newStatus)}"` 
      });

      // Call callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }

      // Refresh the page to show updated data
      router.refresh();

    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate status' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return eventStatusOptions.find(option => option.value === status)?.label || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'ongoing':
        return <PlayCircleIcon className="h-4 w-4 text-yellow-600" />;
      case 'scheduled':
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <PauseCircleIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  // Define status workflow transitions
  const getAvailableTransitions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft':
        return ['scheduled', 'cancelled'];
      case 'scheduled':
        return ['ongoing', 'completed', 'cancelled'];
      case 'ongoing':
        return ['completed', 'cancelled'];
      case 'completed':
        return []; // Final state, no transitions
      case 'cancelled':
        return ['scheduled']; // Can reschedule
      default:
        return eventStatusOptions.map(option => option.value);
    }
  };

  const availableTransitions = getAvailableTransitions(currentStatus);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Manajemen Status</h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon(currentStatus)}
          <span className="text-sm font-medium">
            {getStatusLabel(currentStatus)}
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-3 rounded-md mb-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Current Status Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Status Saat Ini</p>
            <p className="text-lg font-semibold text-gray-700">
              {getStatusLabel(currentStatus)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Event</p>
            <p className="text-sm font-medium text-gray-900 truncate max-w-48">
              {eventTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      {availableTransitions.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            Aksi Cepat
          </Label>
          
          <div className="grid grid-cols-1 gap-2">
            {availableTransitions.map((status) => {
              const statusOption = eventStatusOptions.find(option => option.value === status);
              if (!statusOption) return null;

              return (
                <Button
                  key={status}
                  variant="outline"
                  className={`justify-start ${
                    statusOption.color === 'green' ? 'hover:bg-green-50 hover:border-green-200' :
                    statusOption.color === 'yellow' ? 'hover:bg-yellow-50 hover:border-yellow-200' :
                    statusOption.color === 'blue' ? 'hover:bg-blue-50 hover:border-blue-200' :
                    statusOption.color === 'red' ? 'hover:bg-red-50 hover:border-red-200' :
                    'hover:bg-gray-50'
                  }`}
                  onClick={() => updateStatus(status)}
                  disabled={isUpdating}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <div className="text-left">
                      <p className="font-medium">{statusOption.label}</p>
                      <p className="text-xs text-gray-500">
                        {getStatusDescription(status)}
                      </p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status completed - no more actions */}
      {currentStatus === 'completed' && (
        <div className="text-center py-4">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">Event Telah Selesai</p>
          <p className="text-sm text-green-600">
            Event ini sudah dalam status final
          </p>
        </div>
      )}

      {/* Workflow Information */}
      <div className="mt-6 pt-6 border-t">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Status Workflow
        </Label>
        
        <div className="space-y-2">
          {eventStatusOptions.map((option) => {
            const isCurrentStatus = option.value === currentStatus;
            const isAvailable = availableTransitions.includes(option.value);
            const isPastStatus = getPastStatuses(currentStatus).includes(option.value);
            
            return (
              <div 
                key={option.value}
                className={`flex items-center space-x-3 p-2 rounded ${
                  isCurrentStatus ? 'bg-blue-50 border border-blue-200' :
                  isPastStatus ? 'bg-green-50' :
                  isAvailable ? 'bg-gray-50' :
                  'bg-gray-25'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  isCurrentStatus ? 'bg-blue-500' :
                  isPastStatus ? 'bg-green-500' :
                  isAvailable ? 'bg-gray-400' :
                  'bg-gray-300'
                }`}></div>
                <span className={`text-sm ${
                  isCurrentStatus ? 'font-semibold text-blue-900' :
                  isPastStatus ? 'text-green-700' :
                  isAvailable ? 'text-gray-700' :
                  'text-gray-500'
                }`}>
                  {option.label}
                  {isCurrentStatus && ' (Saat Ini)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Mengupdate status...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get status description
function getStatusDescription(status: string): string {
  switch (status) {
    case 'draft':
      return 'Event dalam tahap perencanaan';
    case 'scheduled':
      return 'Event sudah dijadwalkan';
    case 'ongoing':
      return 'Event sedang berlangsung';
    case 'completed':
      return 'Event telah selesai';
    case 'cancelled':
      return 'Event dibatalkan';
    default:
      return '';
  }
}

// Helper function to get past statuses
function getPastStatuses(currentStatus: string): string[] {
  const statusOrder = ['draft', 'scheduled', 'ongoing', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  if (currentIndex === -1) return [];
  
  return statusOrder.slice(0, currentIndex);
}