import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const games = new Map();

const Action = {
    CLIENT_JOIN: 1,
    CLIENT_LEAVE: 2,
    CLIENT_PING: 3,
    CHAT_MESSAGE: 10,
    CHAT_DELETE: 11,
    HOST_START_GAME: 20,
    HOST_SYNC_BROADCAST: 21,
    HOST_SYNC_REQUEST_REPLY: 22,
    CLIENT_SYNC_REQUEST: 23,
    CLIENT_ACTIVITY_REPLY: 24,
};

export function loadSockets(app, db, io) {
    const DOMPurify = createDOMPurify(new JSDOM('').window);

    io.on('connection', (socket) => {
        console.log(`[SOCKET] Connected: ${socket.id}`);

        socket.on('action', (payload) => {
            if (!payload.data || !payload.data.gameCode) return;

            const code = DOMPurify.sanitize(payload.data.gameCode).toUpperCase();

            const sanitizedData = JSON.parse(DOMPurify.sanitize(JSON.stringify(payload.data)));

            let game = games.get(code);

            switch (payload.action) {
                case Action.CLIENT_JOIN:
                    if (!game) {
                        games.set(code, {
                            hostId: socket.id,
                            hostUserId: sanitizedData.userId,
                            hostName: sanitizedData.playerName || "Host",
                            clients: new Map(),
                            status: 'lobby',
                            mode: sanitizedData.mode || 2,
                            config: null
                        });
                        socket.join(code);
                        console.log(`[HOST] ${sanitizedData.playerName} Created: ${code}`);
                    } else if (game.hostUserId === sanitizedData.userId) {
                        game.hostId = socket.id;
                        if (sanitizedData.playerName) game.hostName = sanitizedData.playerName;
                        socket.join(code);
                        console.log(`[HOST] Reconnected: ${code}`);
                    } else {
                        socket.join(code);
                        game.clients.set(socket.id, {
                            userId: sanitizedData.userId,
                            name: sanitizedData.playerName
                        });

                        io.to(game.hostId).emit('client:action', {
                            type: 'PLAYER_SUBMIT_NAME',
                            name: sanitizedData.playerName,
                            userId: sanitizedData.userId,
                            socketId: socket.id
                        });
                        console.log(`[JOIN] ${sanitizedData.playerName} joined ${code}`);
                    }
                    break;

                case Action.HOST_START_GAME:
                    // Authenticate that the person starting the game is the host
                    if (game && (game.hostId === socket.id || game.hostUserId === sanitizedData.userId)) {
                        game.status = 'playing';
                        game.config = sanitizedData.config;
                        io.to(code).emit('action', {
                            type: Action.HOST_START_GAME,
                            gameId: code
                        });
                        console.log(`[GAME] Started: ${code}`);
                    }
                    break;

                case Action.CLIENT_SYNC_REQUEST:
                    if (game) {
                        const isHost = sanitizedData.userId === game.hostUserId;
                        let playerName = isHost ? game.hostName : "Guest";

                        if (!isHost) {
                            const client = Array.from(game.clients.values()).find(c => c.userId === sanitizedData.userId);
                            if (client) playerName = client.name;
                        }

                        socket.emit('action', {
                            type: Action.HOST_SYNC_REQUEST_REPLY,
                            data: {
                                isHost: isHost,
                                playerName: playerName,
                                mode: game.mode,
                                config: game.config,
                                status: game.status,
                                hostUserId: game.hostUserId
                            }
                        });
                        console.log(`[SYNC] Sent data to ${playerName} in ${code}`);
                    }
                    break;

                default:
                    if (game) {
                        io.to(game.hostId).emit('client:action', {
                            type: payload.action,
                            ...sanitizedData
                        });
                    }
                    break;
            }
        });

        socket.on('disconnect', () => {
            for (const [gameCode, game] of games.entries()) {
                if (game.hostId === socket.id) {
                    io.to(gameCode).emit('host:disconnected');
                    setTimeout(() => {
                        const current = games.get(gameCode);
                        if (current && current.hostId === socket.id) {
                            games.delete(gameCode);
                        }
                    }, 300000);
                } else {
                    game.clients.delete(socket.id);
                }
            }
        });
    });
}