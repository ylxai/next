"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { DownloadIcon, CopyIcon, CheckIcon } from "lucide-react";

interface QRCodeProps {
  text: string;
  size?: number;
  title?: string;
  downloadFilename?: string;
  showDownload?: boolean;
  showCopy?: boolean;
  className?: string;
  alt?: string;
}

export function QRCode({
  text,
  size = 200,
  title,
  downloadFilename,
  showDownload = true,
  showCopy = true,
  className = "",
  alt = "QR Code"
}: QRCodeProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load QR code
  useEffect(() => {
    const loadQRCode = async () => {
      if (!text) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            size: size,
            format: 'base64'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setQrCodeData(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to load QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQRCode();
  }, [text, size]);

  // Download QR code
  const downloadQRCode = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/qr?text=${encodeURIComponent(text)}&size=${size * 2}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFilename || 'qr-code.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Gagal mendownload QR code. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={`qr-code-container ${className}`}>
      {title && (
        <h4 className="font-medium text-gray-900 mb-3 text-center">{title}</h4>
      )}
      
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-lg border-2 border-solid border-gray-200 shadow-sm">
          {isLoading ? (
            <div className="space-y-2">
              <div className="animate-pulse">
                <div 
                  className="bg-gray-200 rounded mx-auto"
                  style={{ width: size, height: size }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">Loading QR Code...</p>
            </div>
          ) : qrCodeData ? (
            <img 
              src={qrCodeData} 
              alt={alt}
              className="mx-auto object-contain"
              style={{ width: size, height: size }}
            />
          ) : (
            <div className="space-y-2">
              <div 
                className="bg-red-100 rounded mx-auto flex items-center justify-center"
                style={{ width: size, height: size }}
              >
                <p className="text-red-500 text-sm">Failed to load</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {(showDownload || showCopy) && qrCodeData && (
        <div className="mt-4 flex justify-center space-x-2">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}
              <span className="ml-2">
                {isDownloading ? 'Downloading...' : 'Download'}
              </span>
            </Button>
          )}

          {showCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              <span className="ml-2">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}