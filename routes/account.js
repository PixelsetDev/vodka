import {withLogto} from "@logto/express";
import {config} from "../auth.js";

export function routeAccount (app) {
    app.get('/account', withLogto(config), (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (request.user.isAuthenticated) {
            response.send({
                'authed': true,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
                'profile': {
                    "username": request.user.claims.username,
                    "name": request.user.claims.name,
                    "uuid": request.user.claims.sub,
                }
            });
        } else {
            response.send({
                'authed': false,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
                'profile': null
            });
        }
    });
}