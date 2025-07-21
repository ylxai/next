import { QRCode } from '@/app/components/ui/qr-code';

export default function TestQRPage() {
  const testUrl = 'http://localhost:3000/event/test-event-123';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8 text-center">QR Code Generator Test</h1>
      
      <div className="space-y-8">
        {/* Basic QR Code */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Basic QR Code</h2>
          <QRCode
            text={testUrl}
            title="Test Event QR Code"
            downloadFilename="test-event-qr.png"
          />
        </div>

        {/* Larger QR Code */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Large QR Code</h2>
          <QRCode
            text={testUrl}
            size={300}
            title="Large QR Code"
            downloadFilename="large-qr.png"
          />
        </div>

        {/* QR Code without actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Display Only</h2>
          <QRCode
            text={testUrl}
            size={150}
            title="Display Only QR"
            showDownload={false}
            showCopy={false}
          />
        </div>

        {/* Custom text QR Code */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Custom Text QR</h2>
          <QRCode
            text="Hello World! This is a test QR code."
            title="Text QR Code"
            downloadFilename="text-qr.png"
          />
        </div>

        {/* API Test Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">API Test Links</h2>
          <div className="space-y-2">
            <p>
              <strong>PNG Direct:</strong>{' '}
              <a 
                href={`/api/qr?text=${encodeURIComponent(testUrl)}&size=200`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                /api/qr?text={testUrl}&size=200
              </a>
            </p>
            <p>
              <strong>SVG Format:</strong>{' '}
              <a 
                href={`/api/qr?text=${encodeURIComponent(testUrl)}&format=svg`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                /api/qr?text={testUrl}&format=svg
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}