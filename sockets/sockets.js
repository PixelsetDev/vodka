import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const games = new Map();

export function loadSockets (app, db, io) {
    const DOMPurify = createDOMPurify(new JSDOM('').window);

    io.on('connection', (socket) => {
        console.log('Connected:', socket.id);

        // 1. IMPROVED HOST JOIN: Prevent Overwriting
        socket.on('host:join', ({ gameCode, hostId }) => {
            const code = DOMPurify.sanitize(gameCode);

            // CHECK FOR CONFLICT: If game exists and isn't owned by this user
            if (games.has(code) && games.get(code).hostUserId !== hostId) {
                socket.emit('error', 'CODE_TAKEN');
                return;
            }

            // If it's a reconnection from the same user, just update the socketId
            if (games.has(code) && games.get(code).hostUserId === hostId) {
                const game = games.get(code);
                game.hostId = socket.id; // Update to the new socket connection
                socket.join(code);
                console.log('Host reconnected:', code);
                return;
            }

            // Otherwise, create a new game
            games.set(code, {
                hostId: socket.id,
                hostUserId: hostId, // Store persistent ID
                clients: new Map(),
                status: 'lobby'
            });

            socket.join(code);
            console.log('Host joined:', code);
        });

        // 2. NEW START SIGNAL: Tells players to move to game screen
        socket.on('host:start_game', ({ gameCode }) => {
            const code = DOMPurify.sanitize(gameCode);
            const game = games.get(code);

            if (game && game.hostId === socket.id) {
                game.status = 'playing';
                // Notify everyone in the room that the game is starting
                io.to(code).emit('game:started');
            }
        });

        socket.on('client:join', ({ gameCode, playerId, playerName }) => {
            const code = DOMPurify.sanitize(gameCode);
            const game = games.get(code);

            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            if (playerName) {
                const name = DOMPurify.sanitize(playerName);
                // Forward the player joining event to the host
                io.to(game.hostId).emit('client:action', {
                    type: 'PLAYER_SUBMIT_NAME',
                    name: name,
                    socketId: socket.id // Useful for targeted communication
                });
            }

            game.clients.set(socket.id, playerId || socket.id);
            socket.join(code);
            console.log('Client joined:', code);
        });

        socket.on('action', ({ gameCode, ...action }) => {
            const code = DOMPurify.sanitize(gameCode);
            const game = games.get(code);
            if (game) {
                io.to(game.hostId).emit('client:action', action);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected:', socket.id);

            for (const [gameCode, game] of games.entries()) {
                if (game.hostId === socket.id) {
                    io.to(gameCode).emit('host:disconnected');
                    setTimeout(() => {
                        if (games.has(gameCode) && games.get(gameCode).hostId === socket.id) {
                            games.delete(gameCode);
                            console.log('Cleaned up game:', gameCode);
                        }
                    }, 300000); // 5 min grace period
                } else {
                    game.clients.delete(socket.id);
                }
            }
        });
    });
}