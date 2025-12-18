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

        socket.on('client:join', ({ gameCode, playerId }) => {
            const code = DOMPurify.sanitize(gameCode);
            const game = games.get(code);

            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Check if player already claimed
            if (Array.from(game.clients.values()).includes(playerId)) {
                socket.emit('error', 'Player already claimed');
                return;
            }

            game.clients.set(socket.id, playerId);
            socket.join(code);
            console.log('Client joined:', code, 'as player', playerId);
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
                    socket.to(gameCode).emit('host:disconnected');
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