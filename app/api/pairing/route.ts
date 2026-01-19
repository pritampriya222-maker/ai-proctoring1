import { NextResponse } from 'next/server';

// Global storage for pairing sessions (in-memory)
// Note: In a serverless environment like Vercel, this might reset on cold starts.
// For production, use Redis, specific database, or a dedicated WebSocket service.
// This is a temporary solution for the prototype.
declare global {
  var activePairingSessions: Record<string, any> | undefined;
}

if (!global.activePairingSessions) {
  global.activePairingSessions = {};
}

const sessions = global.activePairingSessions!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const session = sessions[sessionId];

  if (!session) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, ...session });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, action, ...data } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (!sessions[sessionId]) {
      // Initialize if not exists
      sessions[sessionId] = {
        isPaired: false,
        deviceId: null,
        pairingCode: null,
        lastHeartbeat: null,
        cameraConfirmed: false,
        updatedAt: Date.now(),
      };
    }

    const currentSession = sessions[sessionId];

    switch (action) {
      case 'init':
        // Just ensure it exists
        break;
      
      case 'pair':
        sessions[sessionId] = {
          ...currentSession,
          isPaired: true,
          deviceId: data.deviceId,
          lastHeartbeat: new Date().toISOString(),
          updatedAt: Date.now(),
        };
        break;

      case 'heartbeat':
        sessions[sessionId] = {
          ...currentSession,
          lastHeartbeat: new Date().toISOString(),
          updatedAt: Date.now(),
        };
        break;

      case 'confirm_camera':
        sessions[sessionId] = {
          ...currentSession,
          cameraConfirmed: true,
          updatedAt: Date.now(),
        };
        break;
        
      case 'reset':
         delete sessions[sessionId];
         return NextResponse.json({ success: true, message: 'Session reset' });

      default:
        // Generic update
        sessions[sessionId] = {
          ...currentSession,
          ...data,
          updatedAt: Date.now(),
        };
    }

    return NextResponse.json({ success: true, session: sessions[sessionId] });

  } catch (error) {
    console.error('Pairing API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
