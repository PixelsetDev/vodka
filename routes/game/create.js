import {withLogto} from "@logto/express";
import {config, isAuthenticated} from "../../auth.js";
import {createNewGame} from "../../processes/gameManager.js";

export function routeGameStart (app, db) {
    app.post('/game', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');

        if (isAuthenticated(request.user)) {
            let code;
            if (request.body.mode === typeof undefined || request.body.packs !== typeof Array) {
                code = -3
            } else {
                if (request.body.mode === 1) {
                    // Big screen
                    code = await createNewGame(db, request.user.claims.sub, 1, request.body.packs);
                } else if (request.query.mode === 2) {
                    // Multiplayer
                    code = await createNewGame(db, request.user.claims.sub, 2, request.body.packs);
                } else {
                    // Bad type
                    code = -3;
                }
            }

            if (code === -1) {
                response.send({
                    code: 403,
                    message: "Forbidden",
                    data: null
                });
            } else if (code === -2) {
                response.send({
                    code: 500,
                    message: "Internal Server Error",
                    data: null
                });
            } else if (code === -3) {
                response.send({
                    code: 400,
                    message: "Bad Request",
                    data: null
                });
            } else {
                response.send({
                    code: 201,
                    message: "Created",
                    data: code
                });
            }
        } else {
            response.send({
                code: 401,
                message: "Unauthorized",
                data: null
            })
        }
    });
}