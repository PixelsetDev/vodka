import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const games = new Map();

export function loadSockets (app, db, io) {
    const DOMPurify = createDOMPurify(new JSDOM('').window);

    io.on('connection', (socket) => {
        console.log('Connected:', socket.id);

        socket.on('host:join', ({ gameCode }) => {
            const code = DOMPurify.sanitize(gameCode);
            games.set(code, { hostId: socket.id, clients: new Map() });
            socket.join(code);
            console.log('Host joined:', code);
        });

        // Modified client:join to handle name submission in the lobby
        socket.on('client:join', ({ gameCode, playerId, playerName }) => {
            const code = DOMPurify.sanitize(gameCode);
            const game = games.get(code);

            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // If a playerName is provided, forward it to the host to add to the list
            if (playerName) {
                const name = DOMPurify.sanitize(playerName);
                io.to(game.hostId).emit('client:action', {
                    type: 'PLAYER_SUBMIT_NAME',
                    name: name
                });
            }

            if (playerId && Array.from(game.clients.values()).includes(playerId)) {
                socket.emit('error', 'Player already claimed');
                return;
            }

            game.clients.set(socket.id, playerId || socket.id);
            socket.join(code);
            console.log('Client joined:', code, 'as player', playerId || playerName);
        });

        socket.on('state', ({ gameCode, state }) => {
            const code = DOMPurify.sanitize(gameCode);
            socket.to(code).emit('state', state);
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