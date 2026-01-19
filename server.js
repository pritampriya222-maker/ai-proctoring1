const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ========================
// BACKEND STORES (SINGLE SOURCE OF TRUTH)
// ========================
// In-memory stores replacing client-side only logic
const mobileSessions = new Map(); // sessionId -> { studentId, deviceId, socketId, lastHeartbeat, status, isPaired, cameraConfirmed }
const examSessions = new Map();   // sessionId -> { sessionId, studentId, status, startTime, ... }
const recordings = new Map();     // sessionId -> [chunks]

// Mock data persistence for development (optional, restores sessions on reboot)
const DATA_FILE = path.join(__dirname, 'server-state.json');
try {
    if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (data.mobile) data.mobile.forEach(entry => mobileSessions.set(entry[0], entry[1]));
        if (data.exam) data.exam.forEach(entry => examSessions.set(entry[0], entry[1]));
        console.log('Restored state from disk');
    }
} catch (e) {
    console.log('No previous state found or failed to load');
}

function persistState() {
    try {
        const data = {
            mobile: Array.from(mobileSessions.entries()),
            exam: Array.from(examSessions.entries())
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to persist state', e);
    }
}

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            const { pathname } = parsedUrl;

            // FIX 3: RECORDING CHUNK UPLOAD
            // Custom handler for chunks if we decide to use POST for heavy binary data
            // (Socket.IO can handle it, but POST is often better for large binary blobs)
            if (req.method === 'POST' && pathname === '/api/recording/chunk') {
                // We'll handle this in Next.js API route or here. 
                // Let's defer to Next.js API route for consistency unless performance requires custom parsing.
                // For now, let Next.js handle it.
                await handle(req, res, parsedUrl);
            } else {
                await handle(req, res, parsedUrl);
            }
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(server, {
        path: "/socket.io",
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // ========================
        // FIX 1: MOBILE DEVICE SYNC
        // ========================
        socket.on('mobile-join', ({ sessionId, deviceId, studentId }) => {
            console.log(`Mobile joined: ${sessionId} (${deviceId})`);

            const existing = mobileSessions.get(sessionId) || {};
            const newSession = {
                ...existing,
                sessionId,
                deviceId,
                studentId,
                socketId: socket.id,
                lastHeartbeat: Date.now(),
                status: 'connected',
                isPaired: true
            };

            mobileSessions.set(sessionId, newSession);
            socket.join(sessionId); // Mobile joins session room
            socket.join('admin-room'); // Also notify admins (optional, or emit to admin-room separately)

            io.to(sessionId).emit('mobile-status-update', { status: 'connected', lastHeartbeat: Date.now() });
            io.to('admin-room').emit('pairing-update', { sessionId, status: 'connected', deviceId });

            persistState();
        });

        socket.on('mobile-heartbeat', ({ sessionId }) => {
            const session = mobileSessions.get(sessionId);
            if (session) {
                session.lastHeartbeat = Date.now();
                session.status = 'connected';
                // Only emit if it was previously disconnected or stale? 
                // For now, allow frequent updates or just silent update.
                // Let's emit specific heartbeat ack or update status if needed.
                mobileSessions.set(sessionId, session);
                persistState();
            }
        });

        socket.on('mobile-camera-confirmed', ({ sessionId }) => {
            const session = mobileSessions.get(sessionId);
            if (session) {
                session.cameraConfirmed = true;
                mobileSessions.set(sessionId, session);
                // Emit update to BOTH admin and student (desktop)
                io.to(sessionId).emit('pairing-update', { sessionId, cameraConfirmed: true });
                io.to('admin-room').emit('pairing-update', { sessionId, cameraConfirmed: true });
                persistState();
            }
        });

        // ========================
        // FIX 2 & 7: ADMIN & SESSION SYNC
        // ========================
        socket.on('admin-join', () => {
            console.log(`Admin joined: ${socket.id}`);
            socket.join('admin-room');
            // Send all active sessions to admin immediately
            const allSessions = Array.from(examSessions.values());
            const allMobile = Array.from(mobileSessions.values());
            socket.emit('init-state', { sessions: allSessions, mobile: allMobile });
        });

        socket.on('student-join', ({ sessionId, studentId, studentName, examId }) => {
            console.log(`Student joined: ${studentId} (${sessionId})`);
            socket.join(sessionId);

            let session = examSessions.get(sessionId);
            if (!session) {
                session = {
                    sessionId,
                    studentId,
                    studentName,
                    examId,
                    status: 'pending',
                    startTime: null,
                    joinedAt: Date.now()
                };
                examSessions.set(sessionId, session);
                io.to('admin-room').emit('student-added', session); // Fix 7
            } else {
                // Update connection status or re-join
                session.status = session.status === 'terminated' ? 'terminated' : session.status;
                examSessions.set(sessionId, session);
            }

            persistState();
        });

        socket.on('student-update', ({ sessionId, data }) => {
            const session = examSessions.get(sessionId);
            if (session) {
                Object.assign(session, data); // merging updates
                session.lastUpdate = Date.now();
                examSessions.set(sessionId, session);
                // Emit to admin immediately or throttling will handle it?
                // Let's emit to admin-room to keep it snappy for live monitoring
                io.to('admin-room').emit('session-updated', session);
            }
        });

        // ========================
        // FIX 4: EXAM STATUS
        // ========================
        socket.on('exam-start', ({ sessionId }) => {
            const session = examSessions.get(sessionId);
            if (session) {
                session.status = 'active';
                session.startTime = Date.now();
                examSessions.set(sessionId, session);
                io.to(sessionId).emit('exam-started', { startTime: session.startTime });
                io.to('admin-room').emit('session-updated', session);
                persistState();
            }
        });

        socket.on('exam-submit', ({ sessionId }) => {
            const session = examSessions.get(sessionId);
            if (session) {
                session.status = 'completed';
                session.endTime = Date.now();
                examSessions.set(sessionId, session);
                io.to(sessionId).emit('exam-completed', { endTime: session.endTime });
                io.to('admin-room').emit('session-updated', session);
                persistState();
            }
        });

        // ========================
        // FIX 6: WARNINGS
        // ========================
        socket.on('admin-warning', ({ sessionId, message }) => {
            io.to(sessionId).emit('warning-received', { message, timestamp: Date.now() });
        });

        socket.on('admin-terminate', ({ sessionId, reason }) => {
            const session = examSessions.get(sessionId);
            if (session) {
                session.status = 'terminated';
                examSessions.set(sessionId, session);
                io.to(sessionId).emit('exam-terminated', { reason });
                io.to('admin-room').emit('session-updated', session);
                persistState();
            }
        });

        // ========================
        // WEBRTC SIGNALING
        // ========================
        socket.on('offer', (data) => {
            // data: { type, sdp, targetSessionId }
            socket.to(data.targetSessionId).emit('offer', { ...data, from: socket.id });
        });

        socket.on('request-stream', ({ targetSessionId }) => {
            // Allow the requester (Admin) to join the session room to receive signaling
            socket.join(targetSessionId);

            // Forward request to the session room (where Student is)
            socket.to(targetSessionId).emit('request-stream', { requestorId: socket.id });
        });

        socket.on('answer', (data) => {
            socket.to(data.targetSessionId).emit('answer', { ...data, from: socket.id });
        });

        socket.on('ice-candidate', (data) => {
            socket.to(data.targetSessionId).emit('ice-candidate', { ...data, from: socket.id });
        });

        socket.on('disconnect', () => {
            // Handle cleanup if needed
            // Check if it was a mobile socket
            for (const [sid, mConfig] of mobileSessions.entries()) {
                if (mConfig.socketId === socket.id) {
                    // Don't remove immediately, wait for timeout logic
                    // But mark as potentially disconnected?
                    console.log(`Mobile socket disconnected: ${sid}`);
                }
            }
        });
    });

    // ========================
    // HEARTBEAT MONITOR
    // ========================
    setInterval(() => {
        const now = Date.now();
        let updates = false;

        mobileSessions.forEach((session, sessionId) => {
            if (session.status === 'connected' && (now - session.lastHeartbeat > 10000)) {
                // No heartbeat for 10s -> Disconnected
                session.status = 'disconnected';
                mobileSessions.set(sessionId, session);
                io.to(sessionId).emit('mobile-status-update', { status: 'disconnected' });
                io.to('admin-room').emit('pairing-update', { sessionId, status: 'disconnected' });
                updates = true;
            }
        });

        if (updates) persistState();
    }, 5000);

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
