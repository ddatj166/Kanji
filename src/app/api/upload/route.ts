import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'custom');

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawFile = searchParams.get('file') || '';
    const safeFilename = path.basename(rawFile);

    if (!safeFilename) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, safeFilename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const ext = safeFilename.split('.').pop()?.toLowerCase() || 'png';
    const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let ext = 'png';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { base64Data } = body;

      if (!base64Data) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    }

    // Content-addressed filename avoids duplicate files for identical images
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const safeFilename = `custom_${hash}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
    }

    return NextResponse.json({
      url: `/images/custom/${safeFilename}`,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
