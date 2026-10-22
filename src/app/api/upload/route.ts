import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'custom');

export async function POST(request: Request) {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { base64Data, filename } = body;

      if (!base64Data) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }

      // Format: data:image/png;base64,...
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'png';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        ext = mime.split('/')[1] || 'png';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }

      const safeFilename = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, safeFilename);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        url: `/images/custom/${safeFilename}`
      });
    } else {
      // Multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = file.name.split('.').pop() || 'png';
      const safeFilename = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, safeFilename);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        url: `/images/custom/${safeFilename}`
      });
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
