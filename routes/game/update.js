import {withLogto} from "@logto/express";
import {config, isAuthenticated} from "../../auth.js";
import {updateGameState, getGamePlayers, fetchExistingGame} from "../../processes/gameManager.js";

export function routeGameUpdate(app, db) {
    app.put('/game', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');

        if (isAuthenticated(request.user)) {
            if (typeof request.body.code === 'undefined') {
                response.send({
                    code: 400,
                    message: "Bad Request",
                    data: null
                });
            } else {
                if (await updateGameState(db, request.body.code, request.user.claims.sub)) {
                    response.send({
                        code: 200,
                        message: "OK",
                        data: await fetchExistingGame(db, request.body.code, request.user.claims.sub)
                    });
                } else {
                    response.send({
                        code: 500,
                        message: "Internal Server Error",
                        data: null
                    });
                }
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