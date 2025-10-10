export function loadSockets (app, db, io) {
    io.on('connect', (socket) => {
        socket.emit('screen', 'disclaimer');
    });
}

/*
Join game: server.join('000000');
End game: io.in("room-101").disconnectSockets();
 */