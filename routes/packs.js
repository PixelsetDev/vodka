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

        if (request.user.isAuthenticated) {
            try {
                const [rows] = await db.execute('SELECT * FROM purchases WHERE uuid = ? AND pack = ?', [request.user.claims.sub, request.query.pack]);

                console.log(rows);
                if (rows.length === 0) {
                    response.send({
                        code: 200,
                        data: { "owns": false },
                    });
                } else {
                    response.send({
                        code: 200,
                        data: { "owns": true },
                    });
                }
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

    app.get('/packs/purchase', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');
        const stripe = require('stripe')(process.env.STRIPE_KEY);

        const [row] = await db.execute('SELECT * FROM packs WHERE id = ?', [request.query.pack]);

        if (row.length === 0) {
            response.send({
                "code": 404,
                "data": null,
            })
        } else {
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price: 'price_1SGS3N2MqXdUCHxjCrl7ehkO',
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: process.env.APP_HTTP_PROTOCOL + '://' + process.env.APP_BASE + '/packs/purchase/success',
                cancel_url: process.env.APP_HTTP_PROTOCOL + '://' + process.env.APP_BASE + '/packs/purchase/error',
            });
        }
    });

    app.get('/packs/purchase/success', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'text/html');
        response.send("<b>Success</b>")
    });

    app.get('/packs/purchase/error', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'text/html');
        response.send("<b>Error</b>")
    });
}