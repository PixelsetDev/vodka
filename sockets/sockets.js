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
                        const hostIdToSet = sanitizedData.userId || "MISSING_ID_" + Math.random();

                        games.set(code, {
                            hostId: socket.id,
                            hostUserId: hostIdToSet,
                            hostName: sanitizedData.playerName || "Host",
                            clients: new Map(),
                            status: 'lobby',
                            mode: sanitizedData.mode || 2,
                            config: null
                        });
                        socket.join(code);
                        console.log(`[HOST] ${sanitizedData.playerName} Created Room: ${code} with ID: ${hostIdToSet}`);
                    } else if (sanitizedData.userId && game.hostUserId === sanitizedData.userId) {
                        game.hostId = socket.id;
                        if (sanitizedData.playerName) game.hostName = sanitizedData.playerName;
                        socket.join(code);
                        console.log(`[HOST] Reconnected: ${code} (ID: ${sanitizedData.userId})`);

                    } else {
                        socket.join(code);
                        game.clients.set(socket.id, {
                            userId: sanitizedData.userId,
                            name: sanitizedData.playerName || "Guest"
                        });

                        io.to(game.hostId).emit('client:action', {
                            type: 'PLAYER_SUBMIT_NAME',
                            name: sanitizedData.playerName || "Guest",
                            userId: sanitizedData.userId,
                            socketId: socket.id
                        });

                        io.to(code).emit('action', {
                            type: Action.CLIENT_JOIN,
                            data: {
                                gameCode: code,
                                userId: sanitizedData.userId,
                                playerName: sanitizedData.playerName || "Guest"
                            }
                        });

                        console.log(`[JOIN] Guest ${sanitizedData.playerName} (ID: ${sanitizedData.userId}) joined ${code}`);
                    }
                    break;

                case Action.HOST_START_GAME:
                    // Authenticate that the person starting the game is the host
                    if (game && (game.hostId === socket.id || game.hostUserId === sanitizedData.userId)) {
                        game.status = 'playing';
                        game.config = sanitizedData.config;
                        io.to(code).emit('action', {
                            type: Action.HOST_START_GAME,
                            recipients: null,
                            gameId: code
                        });
                        console.log(`[GAME] Started: ${code}`);
                    }
                    break;

                case Action.CLIENT_SYNC_REQUEST:
                    if (game) {
                        const isHost = sanitizedData.userId === game.hostUserId;
                        let playerName = isHost ? game.hostName : "Guest";

                        const connectedPlayers = Array.from(game.clients.values()).map(c => ({
                            name: c.name,
                            userId: c.userId
                        }));

                        connectedPlayers.unshift({ name: game.hostName, userId: game.hostUserId });

                        socket.emit('action', {
                            type: Action.HOST_SYNC_REQUEST_REPLY,
                            data: {
                                isHost: isHost,
                                playerName: playerName,
                                mode: game.mode,
                                config: game.config,
                                status: game.status,
                                serverPlayerList: connectedPlayers
                            }
                        });

                        io.to(game.hostId).emit('action', {
                            type: Action.CLIENT_SYNC_REQUEST,
                            recipients: game.hostId,
                            data: sanitizedData
                        });

                        console.log(`[SYNC] Handshake: Info sent to Client, Request forwarded to Host in ${code}`);
                    }
                    break;

                case Action.HOST_SYNC_BROADCAST:
                    if (game && (socket.id === game.hostId || sanitizedData.userId === game.hostUserId)) {
                        socket.to(code).emit('action', {
                            type: Action.HOST_SYNC_BROADCAST,
                            recipients: null,
                            data: sanitizedData
                        });
                        console.log(`[BROADCAST] State synced to all clients in ${code}`);
                    }
                    break;

                case Action.HOST_SYNC_REQUEST_REPLY:
                    if (game && (socket.id === game.hostId || sanitizedData.userId === game.hostUserId)) {
                        io.to(code).emit('action', {
                            type: Action.HOST_SYNC_REQUEST_REPLY,
                            recipients: payload.recipients,
                            data: sanitizedData
                        });
                    }
                    console.log(`[BROADCAST] Sent host sync request reply to ${payload.recipients.toString()} for ${code}`);
                    break;

                default:
                    if (game) {
                        io.to(game.hostId).emit('client:action', {
                            type: payload.action,
                            recipients: game.hostId,
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