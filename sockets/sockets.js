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
                            clients: new Map(),
                            status: 'lobby'
                        });
                        socket.join(code);
                        console.log(`[HOST] Room Created: ${code}`);
                    } else if (game.hostUserId === sanitizedData.userId) {
                        game.hostId = socket.id;
                        socket.join(code);
                        console.log(`[HOST] Reconnected: ${code}`);
                    } else {
                        if (sanitizedData.playerName && sanitizedData.playerName.length > 20) {
                            return socket.emit('error', 'Name too long');
                        }
                        socket.join(code);
                        game.clients.set(socket.id, sanitizedData.userId || socket.id);

                        io.to(game.hostId).emit('client:action', {
                            type: 'PLAYER_SUBMIT_NAME',
                            name: sanitizedData.playerName,
                            socketId: socket.id
                        });
                        console.log(`[JOIN] Player ${sanitizedData.playerName} in ${code}`);
                    }
                    break;

                case Action.HOST_START_GAME:
                    if (game && game.hostId === socket.id) {
                        game.status = 'playing';
                        // Broadcast clean config to the room
                        io.to(code).emit('action', {
                            type: Action.HOST_START_GAME,
                            gameId: code,
                            config: sanitizedData.config
                        });
                        console.log(`[GAME] Started: ${code}`);
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