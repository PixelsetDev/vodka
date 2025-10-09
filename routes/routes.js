import {withLogto} from "@logto/express";
import {config} from "../auth.js";

export function loadRoutes (app, db) {
    app.get("/", (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (process.env.APP_DEBUG === "true") {
            response.send({
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
        } else {
            response.send({
                'app': 'D_VODKA_API'
            });
        }
    });

    app.get('/logto/status', withLogto(config), (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (request.user.isAuthenticated) {
            res.send({
                'authed': true,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
                'profile': request.user.claims
            });
        } else {
            res.send({
                'authed': false,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
                'profile': null
            });
        }
    });

    app.get('/packs/list', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (request.user.isAuthenticated) {
            try {
                const [rows] = await db.query("SELECT * FROM packs");
                response.send({
                    code: 200,
                    data: rows,
                });
            } catch (err) {
                response.send({
                    code: 500,
                    data: err.message,
                });
            }

        } else {
            response.send({
                "code": 403,
                "data": null,
            })
        }
    });
}