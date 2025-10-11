import {withLogto} from "@logto/express";
import {config, isAuthenticated} from "../../auth.js";
import {fetchExistingGame} from "../../processes/gameManager.js";

export function routeGameFetch (app, db) {
    app.get('/game', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');

        if (request.query.code.trim() === "") {
            response.send({
                code: 400,
                message: "Bad Request",
                data: null
            })
        } else {
            if (isAuthenticated(request.user)) {
                response.send({
                    code: 200,
                    message: "OK",
                    data: await fetchExistingGame(db, request.query.code)
                })
            } else {
                response.send({
                    code: 401,
                    message: "Unauthorized",
                    data: null
                })
            }
        }
    });
}