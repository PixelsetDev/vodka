import {withLogto} from "@logto/express";
import {config, isAuthenticated} from "../auth.js";

export function routeAccount (app) {
    app.get('/account', withLogto(config), (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (isAuthenticated(request.user)) {
            response.send({
                code: 200,
                message: "OK",
                data: {
                    username: request.user.claims.username,
                    name: request.user.claims.name,
                    uuid: request.user.claims.sub,
                    roles: request.user.claims.roles,
                }
            });
        } else {
            response.send({
                code: 401,
                message: "Unauthorized",
                data: null
            });
        }
    });
}