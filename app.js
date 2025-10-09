import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { handleAuthRoutes } from '@logto/express';
import { config } from './routes/auth.js';
import { loadRoutes } from './routes/routes.js';
import mysql from 'mysql2/promise';
let oidcConnected;

console.log("VODKA > Loading...");

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(
    session({
        secret: process.env.APP_SECRET,
        cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
    })
);
app.use(handleAuthRoutes(config));
app.use(express.json());

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
        const db = await mysql.createConnection({
            host: process.env.SQL_HOST,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DATABASE,
            connectTimeout: 10000
        });

        await db.connect(function(err) {
            if (err) {
                console.error("VODKA > Unable to connect to MYSQL.");
                console.error(err);
            } else {
                console.log("VODKA > Connected to MYSQL.");
                app.listen(process.env.APP_PORT, () => {
                    console.log("VODKA > Listening on PORT:", process.env.APP_PORT);
                    console.log("VODKA > Ready for connections.");
                    loadRoutes(app, db);
                });
            }
        });
    }
}