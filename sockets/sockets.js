import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// The in-memory store for active sessions
const games = new Map();

// Enum-like Action types matching your frontend
const Action = {
    CLIENT_JOIN: 1,
    CLIENT_LEAVE: 2,
    CLIENT_PING: 3,
    CHAT_MESSAGE: 10,
    CHAT_DELETE: 11,
    HOST_SYNC_BROADCAST: 20,
    HOST_SYNC_REQUEST_REPLY: 21,
    CLIENT_SYNC_REQUEST: 22,
    CLIENT_ACTIVITY_REPLY: 23,
};

export function loadSockets(app, db, io) {
    const DOMPurify = createDOMPurify(new JSDOM('').window);

    io.on('connection', (socket) => {
        console.log(`[SOCKET] Connected: ${socket.id}`);

        // HOST: Explicit Join (Handles Room Creation/Reconnection)
        socket.on('host:join', ({ gameCode, hostId }) => {
            const code = DOMPurify.sanitize(gameCode);

            // CHECK FOR CONFLICT: If game exists and isn't owned by this user
            if (games.has(code) && games.get(code).hostUserId !== hostId) {
                socket.emit('error', 'CODE_TAKEN');
                return;
            }

            // Handle Reconnection
            if (games.has(code) && games.get(code).hostUserId === hostId) {
                const game = games.get(code);
                game.hostId = socket.id;
                socket.join(code);
                console.log(`[HOST] Reconnected to room: ${code}`);
                return;
            }

            // Create New Session
            games.set(code, {
                hostId: socket.id,
                hostUserId: hostId,
                clients: new Map(),
                status: 'lobby'
            });

            socket.join(code);
            console.log(`[HOST] Created room: ${code}`);
        });

        // HOST: Start Signal
        socket.on('host:start_game', ({ gameCode }) => {
            const code = DOMPurify.sanitize(gameCode);
            const game = games.get(code);

            if (game && game.hostId === socket.id) {
                game.status = 'playing';
                io.to(code).emit('game:started');
                console.log(`[GAME] Started: ${code}`);
            }
        });

        // UNIFIED ACTION HANDLER
        socket.on('action', (payload) => {
            const { type, gameCode, ...data } = payload;
            if (!gameCode) return;

            const code = DOMPurify.sanitize(gameCode);
            const game = games.get(code);
            if (!game) return socket.emit('error', 'Game not found');

            // Recursive or shallow sanitation of action data
            const sanitizedData = Object.keys(data).reduce((acc, key) => {
                acc[key] = typeof data[key] === 'string'
                    ? DOMPurify.sanitize(data[key])
                    : data[key];
                return acc;
            }, {});

            switch (type) {
                case Action.CLIENT_JOIN: // 1
                    if (sanitizedData.playerName && sanitizedData.playerName.length > 20) {
                        return socket.emit('error', 'Name too long');
                    }

                    socket.join(code);
                    game.clients.set(socket.id, sanitizedData.userId || socket.id);

                    // Notify Host to update UI list
                    io.to(game.hostId).emit('client:action', {
                        type: 'PLAYER_SUBMIT_NAME',
                        name: sanitizedData.playerName,
                        socketId: socket.id
                    });
                    console.log(`[JOIN] ${sanitizedData.playerName} joined ${code}`);
                    break;

                case Action.CLIENT_PING: // 3
                    socket.emit('action', { type: Action.CLIENT_PING, time: Date.now() });
                    break;

                default:
                    // Forward any other actions (Sync, Chat, etc.) to the host
                    io.to(game.hostId).emit('client:action', { type, ...sanitizedData });
                    break;
            }
        });

        socket.on('disconnect', () => {
            for (const [gameCode, game] of games.entries()) {
                if (game.hostId === socket.id) {
                    io.to(gameCode).emit('host:disconnected');
                    // 5 min grace period for host refresh
                    setTimeout(() => {
                        const current = games.get(gameCode);
                        if (current && current.hostId === socket.id) {
                            games.delete(gameCode);
                            console.log(`[CLEANUP] Room ${gameCode} deleted`);
                        }
                    }, 300000);
                } else {
                    game.clients.delete(socket.id);
                }
            }
        });
    });
}