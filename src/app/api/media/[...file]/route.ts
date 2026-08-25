import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/core/_lib/auth';

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.md': 'text/markdown',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ file: string[] }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file } = await params;
  if (!file || file.length === 0) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const filename = file.join('/');
  
  const baseDir = path.resolve(process.cwd(), 'src', 'modules', 'core', '_assets');
  const resolvedPath = path.resolve(baseDir, filename);

  // Prevent path traversal attacks
  if (!resolvedPath.startsWith(baseDir) || filename.includes('..') || filename.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const fileSize = stat.size;
    const contentType = getMimeType(resolvedPath);
    const rangeHeader = _request.headers.get('range');

    // HTTP 206 Partial Content (essential for Safari HTML5 video streaming and media scrubbing)
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize || (parts[1] && isNaN(end)) || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(resolvedPath, { start, end });
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(readableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    }

    const fileStream = fs.createReadStream(resolvedPath);
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving media file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
