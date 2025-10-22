import {withLogto} from "@logto/express";
import {config, isAuthenticated} from "../../auth.js";
import {updateGameState, fetchExistingGame} from "../../processes/gameManager.js";

export function routeGameUpdate(app, db) {
    app.put('/game', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');

        if (isAuthenticated(request.user)) {
            if (typeof request.body.code === 'undefined') {
                response.send({
                    code: 400,
                    message: "Bad Request",
                    data: "Something went wrong sending the request, please try again later or contact our support team by clicking the button below for assistance."
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
                        data: "Something went wrong with the server, please try again later or contact our support team by clicking the button below for assistance."
                    });
                }
            }
        } else {
            response.send({
                code: 401,
                message: "Unauthorized",
                data: "Your login session may have expired. Please click 'Exit', then try and log in again. If that doesn't fix your issue, please contact our support team for help."
            })
        }
    });
}