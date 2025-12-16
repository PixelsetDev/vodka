import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { handleAuthRoutes } from '@logto/express';
import { config } from './auth.js';
import { loadRoutes } from './routes/routes.js';
import { loadSockets } from './sockets/sockets.js';
import {Server} from 'socket.io';
import { createServer } from 'http';
import {pool} from "./processes/database.js";
import * as path from "node:path";
import { fileURLToPath } from 'url';
let oidcConnected;

const dir = path.dirname(fileURLToPath(import.meta.url));

console.log("VODKA > Loading...");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/static', express.static(path.join(dir, 'static')));
app.use(
    session({
        secret: process.env.APP_SECRET,
        cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }
    })
);
app.use(handleAuthRoutes(config));

console.log("VODKA > Loaded config.");

if (process.env.APP_DEBUG === "true") {
    console.log({
        'app': 'D_VODKA_API', 'config': {
            'APP_PORT': process.env.APP_PORT,
            'APP_BASE': process.env.APP_BASE,
            'APP_SECRET': '[REDACTED]',
            'APP_HTTP_PROTOCOL': process.env.APP_HTTP_PROTOCOL,
            'APP_DEBUG': process.env.APP_DEBUG,
            'SQL_HOST': process.env.SQL_HOST,
            'SQL_USER': process.env.SQL_USER,
            'SQL_PASSWORD': '[REDACTED]',
            'SQL_DATABASE': process.env.SQL_DATABASE,
            'OIDC_BASE': process.env.OIDC_BASE,
            'OIDC_CLIENT_ID': process.env.OIDC_CLIENT_ID,
            'OIDC_SECRET': '[REDACTED]',
        }
    });
}

console.log("VODKA > Loaded.");
console.log("VODKA > Connecting to LogTo (OIDC) Server...");
try {
    await fetch("https://auth.portalsso.com/oidc/.well-known/openid-configuration");
    console.log("VODKA > Connected.");
    oidcConnected = true;
} catch (err) {
    console.error("VODKA > Failed to connect to LogTo (OIDC).");
    console.error(err);
    oidcConnected = false;
}

if (!process.env.TRUST_PROXY_HEADER) {
    console.error("VODKA > Proxy header untrusted.");
} else {
    if (oidcConnected) {
        console.log("VODKA > Connecting to MYSQL...");
        try {
            const db = await pool;

            console.log("VODKA > Connected to MYSQL.");

            const server = createServer(app);
            server.listen(process.env.APP_PORT);

            console.log("VODKA > HTTP & WSS Listening on PORT:", process.env.APP_PORT);
            console.log("VODKA > Ready for connections.");
            loadSockets(app, db, new Server(server));
            loadRoutes(app, db);

        } catch (err) {
            console.error("VODKA > Unable to connect to MYSQL.");
            console.error(err);
        }
    }
}