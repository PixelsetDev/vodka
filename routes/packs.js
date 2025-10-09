import {withLogto} from "@logto/express";
import {config} from "../auth.js";

export function routePacks (app, db) {
    app.get('/packs/list', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (request.user.isAuthenticated) {
            try {
                const [rows] = await db.query("SELECT * FROM packs");
                response.send({
                    code: 200,
                    data: rows,
                });
            } catch (err) {
                response.send({
                    code: 500,
                    data: err.message,
                });
            }

        } else {
            response.send({
                "code": 403,
                "data": null,
            })
        }
    });

    app.get('/packs/owns', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');
        const urlParams = new URLSearchParams(window.location.search);

        if (request.user.isAuthenticated) {
            try {
                const uuid = urlParams.get('uuid');
                const pack = urlParams.get('pack');

                const [rows] = await db.query("SELECT * FROM purchases WHERE uuid = '"+uuid+"' AND pack = '"+pack+"'");
                console.log(rows);

                response.send({
                    code: 200,
                    data: rows,
                });
            } catch (err) {
                response.send({
                    code: 500,
                    data: err.message,
                });
            }

        } else {
            response.send({
                "code": 403,
                "data": null,
            })
        }
    });
}