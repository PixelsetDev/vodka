import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import crypto from 'crypto';

let activeRooms = {};

export function loadSockets (app, db, io) {
    const DOMPurify = createDOMPurify(new JSDOM('').window);

    io.on('connect', async (socket) => {
        socket.emit('initsuccess', crypto.createHash('sha3-512').update(Math.floor(Math.random() * 999999999999)).digest())
    });

    io.on('join', async (socket, msg) => {
        msg = JSON.parse(msg);
        let code = DOMPurify.sanitize(msg.code);
        let secret = DOMPurify.sanitize(msg.secret);

        socket.join(code);
        socket.emit('joined',code)
    });

    io.on('end', async (socket, msg) => {
        msg = JSON.parse(msg);
        let code = DOMPurify.sanitize(msg.code);
        let secret = DOMPurify.sanitize(msg.secret);

        socket.join(code);
        io.in(code).disconnectSockets();
    });

    io.on("disconnect", (reason, details) => {
        // ...
    });
}

/*
Join game: server.join('000000');
End game: io.in("room-101").disconnectSockets();
 */