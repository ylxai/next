"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  QrCodeIcon, 
  CopyIcon, 
  DownloadIcon, 
  MailIcon, 
  MessageSquareIcon,
  LinkIcon,
  CheckIcon
} from "lucide-react";

interface EventSharingProps {
  eventId: string;
  accessCode: string;
  eventTitle: string;
  isPublic: boolean;
}

export function EventSharing({ accessCode, eventTitle, isPublic }: EventSharingProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Generate URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const eventUrl = `${baseUrl}/event/${accessCode}`;

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Generate QR Code
  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      // This will be implemented when we create the QR code API endpoint
      const response = await fetch(`/api/qr?text=${encodeURIComponent(eventUrl)}&size=300`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${accessCode}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Share via email
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Akses Galeri Foto - ${eventTitle}`);
    const body = encodeURIComponent(`
Halo!

Anda dapat mengakses galeri foto untuk event "${eventTitle}" melalui link berikut:

${eventUrl}

Kode Akses: ${accessCode}

Terima kasih!
    `);
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`
Galeri Foto - ${eventTitle}

Akses galeri foto event melalui link berikut:
${eventUrl}

Kode Akses: ${accessCode}
    `);
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Bagikan Event</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isPublic ? 'Publik' : 'Privat'}
          </span>
        </div>
      </div>

      {/* Access Information */}
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="access-url" className="text-sm font-medium text-gray-700">
            URL Akses Event
          </Label>
          <div className="flex mt-1">
            <Input
              id="access-url"
              value={eventUrl}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => copyToClipboard(eventUrl, 'url')}
            >
              {copied === 'url' ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="access-code" className="text-sm font-medium text-gray-700">
            Kode Akses
          </Label>
          <div className="flex mt-1">
            <Input
              id="access-code"
              value={accessCode}
              readOnly
              className="flex-1 font-mono text-lg font-semibold"
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => copyToClipboard(accessCode, 'code')}
            >
              {copied === 'code' ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">QR Code</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={generateQRCode}
            disabled={isGeneratingQR}
          >
            {isGeneratingQR ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            ) : (
              <DownloadIcon className="h-4 w-4" />
            )}
            <span className="ml-2">
              {isGeneratingQR ? 'Generating...' : 'Download QR'}
            </span>
          </Button>
        </div>
        
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">QR Code Preview</p>
            <p className="text-xs text-gray-400">Click Download untuk generate</p>
          </div>
        </div>
      </div>

      {/* Quick Share Actions */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Bagikan Cepat
        </Label>
        
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            className="justify-start"
            onClick={shareViaEmail}
          >
            <MailIcon className="h-4 w-4 mr-3 text-blue-500" />
            <div className="text-left">
              <p className="font-medium">Email</p>
              <p className="text-xs text-gray-500">Kirim via email client</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={shareViaWhatsApp}
          >
            <MessageSquareIcon className="h-4 w-4 mr-3 text-green-500" />
            <div className="text-left">
              <p className="font-medium">WhatsApp</p>
              <p className="text-xs text-gray-500">Share via WhatsApp</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => copyToClipboard(eventUrl, 'share')}
          >
            <LinkIcon className="h-4 w-4 mr-3 text-purple-500" />
            <div className="text-left">
              <p className="font-medium">Copy Link</p>
              <p className="text-xs text-gray-500">
                {copied === 'share' ? 'Link copied!' : 'Copy ke clipboard'}
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-3">Cara Menggunakan</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              1
            </div>
            <p>
              <strong>Share URL atau QR Code</strong> ke klien melalui email, WhatsApp, atau media lainnya
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              2
            </div>
            <p>
              <strong>Klien mengakses</strong> menggunakan link atau scan QR code
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              3
            </div>
            <p>
              <strong>Masukkan kode akses</strong> jika diperlukan: <code className="bg-gray-100 px-1 rounded">{accessCode}</code>
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
              4
            </div>
            <p>
              <strong>Klien dapat melihat</strong> dan download foto dari galeri event
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      {!isPublic && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Event Privat:</strong> Hanya orang dengan link dan kode akses yang dapat mengakses galeri ini.
          </p>
        </div>
      )}
    </div>
  );
}