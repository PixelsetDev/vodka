import {withLogto} from "@logto/express";
import {config, handleAuthRoute} from "./auth.js";

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
        handleAuthRoute(request, response);
    });

    app.get('/packs/list', withLogto(config), (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (request.user.isAuthenticated) {
            db.query("SELECT * FROM packs", function (err, result, fields) {
                if (err) {
                    response.send({
                        "code": 500,
                        "data": err.message,
                    })
                } else {
                    response.send({
                        "code": 200,
                        "data": result,
                    })
                }
            });
        } else {
            response.send({
                "code": 403,
                "data": null,
            })
        }
    });
}