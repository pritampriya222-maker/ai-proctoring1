import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Recording Chunk Handler
 * Appends video chunks to server-side files
 */

const RECORD_DIR = path.join(process.cwd(), 'recordings');

// Ensure directory exists
try {
    if (!fs.existsSync(RECORD_DIR)) {
        fs.mkdirSync(RECORD_DIR, { recursive: true });
    }
} catch (e) {
    console.error("Failed to create recordings dir", e);
}

export async function POST(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sessionId = searchParams.get('sessionId');
        const type = searchParams.get('type') || 'desktop'; // 'mobile' or 'desktop'

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        // Capture the chunk
        const chunkBlob = await req.blob();
        const buffer = Buffer.from(await chunkBlob.arrayBuffer());

        if (buffer.length === 0) {
            return NextResponse.json({ success: true, size: 0 });
        }

        const filename = `${sessionId}-${type}.webm`;
        const filepath = path.join(RECORD_DIR, filename);

        // Append to file
        // Note: In a real production scalable env, we'd use S3 multipart upload or similar.
        // For this local setup, fs.appendFile is sufficient.
        await fs.promises.appendFile(filepath, buffer);

        return NextResponse.json({ success: true, size: buffer.length });
    } catch (error) {
        console.error('Chunk upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
