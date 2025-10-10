export function loadSockets (app, db, io) {
    io.on('connect', (socket) => {
        console.log('A user connected');
        socket.emit('connected', 'success');
    });
}

/*
Join game: server.join('000000');
End game: io.in("room-101").disconnectSockets();
 */