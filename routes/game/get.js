import {withLogto} from "@logto/express";
import {config} from "../../auth.js";
import {fetchExistingGame} from "../../processes/gameManager";

export function routeGameFetch (app, db) {
    app.get('/game', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');

        if (request.user.isAuthenticated) {
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
    });
}