import {withLogto} from "@logto/express";
import {config} from "../auth";

export function routeAccount (app) {
    app.get('/account', withLogto(config), (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (request.user.isAuthenticated) {
            console.log(request.user);
            response.send({
                'authed': true,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
                'profile': {
                    "username": request.user.username,
                    "name": request.user.name,
                    "uuid": request.user.uuid,
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