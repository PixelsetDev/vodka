import dotenv from 'dotenv';
import express, {response} from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import {handleAuthRoutes, withLogto} from '@logto/express';
import { config, handleAuthRoute } from './auth.ts';
let oidcConnected = false;

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
    const res = await fetch("https://auth.portalsso.com/oidc/.well-known/openid-configuration");
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
            response.send("D_VODKA_API");
        });

        app.get('/logto/status', withLogto(config), (req, res) => {
            handleAuthRoute(req, request, res);
        });
    }
}