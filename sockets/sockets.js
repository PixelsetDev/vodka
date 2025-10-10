export function loadSockets (app, db, io) {
    io.on('connect', async (socket) => {
        socket.emit('initsuccess','success')
    });
}

/*
Join game: server.join('000000');
End game: io.in("room-101").disconnectSockets();
 */