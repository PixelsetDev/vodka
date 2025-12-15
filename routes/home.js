import {withLogto} from "@logto/express";
import {config, isAuthenticated} from "../auth";

export function routeHome (app) {
    app.get("/", (request, response) => {
        response.redirect(process.env.OIDC_POST_LOGIN_URL);
    });

    app.get("/status", withLogto(config), (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (process.env.APP_DEBUG === "true") {
            if (isAuthenticated(request.user)) {
                response.send({
                    'app': 'D_VODKA_API',
                    'auth': true,
                    'user': request.user.username
                });
            } else {
                response.send({
                    'app': 'D_VODKA_API',
                    'auth': false,
                    'user': null
                });
            }
        } else {
            response.send({
                'app': 'D_VODKA_API'
            });
        }
    });
}