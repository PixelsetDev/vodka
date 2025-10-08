import dotenv from 'dotenv';
import express, {response} from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import {handleAuthRoutes, withLogto} from '@logto/express';
import { config, handleAuthRoute } from './auth.ts';
let oidcConnected;

console.log("VODKA > Loading...");

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(
    session({
        secret: process.env.APP_SECRET,
        cookie: {maxAge: 14 * 24 * 60 * 60 * 1000},
    })
);
app.use(handleAuthRoutes(config));
app.use(express.json());

console.log("VODKA > Loaded.");
console.log("VODKA > Connecting to LogTo (OIDC) Server...");
try {
    await fetch("https://auth.portalsso.com/oidc/.well-known/openid-configuration");
    console.log("VODKA > Connected.");
    oidcConnected = true;
} catch (err) {
    console.error("VODKA > Failed to connect to LogTo (OIDC).");
    oidcConnected = false;
}

if (!process.env.TRUST_PROXY_HEADER) {
    console.error("VODKA > Proxy header untrusted.");
} else {
    if (oidcConnected) {
        app.listen(process.env.APP_PORT, () => {
            console.log("VODKA > Listening on PORT:", process.env.APP_PORT);
            console.log("VODKA > Ready for connections.");
        });

        app.get("/", (req, res) => {
            res.setHeader('content-type', 'application/json');
            if (process.env.DEBUG) {
                res.send({
                    'app': 'D_VODKA_API', 'config': {
                        'APP_PORT': process.env.APP_PORT,
                        'APP_BASE': process.env.APP_BASE,
                        'APP_SECRET': process.env.APP_SECRET,
                        'APP_HTTP_PROTOCOL': process.env.APP_HTTP_PROTOCOL,
                        'APP_DEBUG': process.env.APP_DEBUG,
                        'OIDC_BASE': process.env.OIDC_BASE,
                        'OIDC_CLIENT_ID': process.env.OIDC_CLIENT_ID,
                        'OIDC_SECRET': '[REDACTED]',
                    }
                });
            } else {
                res.send({
                    'app': 'D_VODKA_API'
                });
            }
        });

        app.get('/logto/status', withLogto(config), (req, res) => {
            res.setHeader('content-type', 'application/json');
            handleAuthRoute(req, request, res);
        });
    }
}