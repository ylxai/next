import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const size = parseInt(searchParams.get('size') || '300');
    const format = searchParams.get('format') || 'png';

    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    // QR Code options
    const options = {
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: size
    };

    if (format === 'svg') {
      // Generate SVG QR code
      const svgString = await QRCode.toString(text, {
        ...options,
        type: 'svg' as const
      });

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } else {
      // Generate PNG QR code
      const buffer = await QRCode.toBuffer(text, options);

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Disposition': `inline; filename="qr-code.png"`,
        },
      });
    }
  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, size = 300, format = 'png', options = {} } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    // Merge custom options with defaults
    const qrOptions = {
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: size,
      ...options
    };

    if (format === 'svg') {
      const svgString = await QRCode.toString(text, {
        ...qrOptions,
        type: 'svg' as const
      });

      return NextResponse.json({
        success: true,
        data: svgString,
        format: 'svg'
      });
    } else if (format === 'base64') {
      const dataUrl = await QRCode.toDataURL(text, qrOptions);

      return NextResponse.json({
        success: true,
        data: dataUrl,
        format: 'base64'
      });
    } else {
      const buffer = await QRCode.toBuffer(text, qrOptions);
      const base64 = buffer.toString('base64');

      return NextResponse.json({
        success: true,
        data: `data:image/png;base64,${base64}`,
        format: 'png'
      });
    }
  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}