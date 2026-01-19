
import { NextResponse } from 'next/server';
import type { ActiveSessionData } from '@/services/session-registry';

// Use a global variable to store sessions in memory
// Note: This is ephemeral and will reset on server restart, but works for a persistent server process or
// simple demos. For production, use Redis/Postgres/Vercel KV.
declare global {
    var globalActiveSessions: ActiveSessionData[] | undefined;
}

if (!globalThis.globalActiveSessions) {
    globalThis.globalActiveSessions = [];
}

export async function GET() {
    return NextResponse.json(globalThis.globalActiveSessions || []);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, data, sessionId } = body;

        let sessions = globalThis.globalActiveSessions || [];

        if (action === 'register') {
            const existingIndex = sessions.findIndex(s => s.sessionId === data.sessionId);
            const sessionData = { ...data, lastUpdate: Date.now() };

            if (existingIndex >= 0) {
                sessions[existingIndex] = sessionData;
            } else {
                sessions.push(sessionData);
            }
        } else if (action === 'update') {
            const index = sessions.findIndex(s => s.sessionId === sessionId);
            if (index >= 0) {
                sessions[index] = {
                    ...sessions[index],
                    ...data,
                    lastUpdate: Date.now()
                };
            }
        } else if (action === 'log_activity') {
            const index = sessions.findIndex(s => s.sessionId === sessionId);
            if (index >= 0) {
                if (!sessions[index].activityLog) sessions[index].activityLog = [];
                sessions[index].activityLog.push({ action: data.action, timestamp: Date.now() });
                sessions[index].lastUpdate = Date.now();
            }
        } else if (action === 'add_flag') {
            const index = sessions.findIndex(s => s.sessionId === sessionId);
            if (index >= 0) {
                if (!sessions[index].behaviorFlags) sessions[index].behaviorFlags = [];
                sessions[index].behaviorFlags.push(data.flag);
                sessions[index].lastUpdate = Date.now();
            }
        } else if (action === 'complete') {
            const index = sessions.findIndex(s => s.sessionId === sessionId);
            if (index >= 0) {
                sessions[index].webcamActive = false;
                sessions[index].screenShareActive = false;
                sessions[index].mobileConnected = false;
                sessions[index].lastUpdate = Date.now();
            }
        } else if (action === 'remove') {
            sessions = sessions.filter(s => s.sessionId !== sessionId);
        }

        globalThis.globalActiveSessions = sessions;
        return NextResponse.json({ success: true, count: sessions.length });
    } catch (e) {
        console.error("Failed to update sessions", e);
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
