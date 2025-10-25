import {withLogto} from "@logto/express";
import {config, isAuthenticated} from "../auth.js";
import Stripe from 'stripe';
import {userOwns} from "../processes/packs.js";

export function routePacks(app, db) {
    app.get('/packs/list', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');

        if (isAuthenticated(request.user)) {
            try {
                const [rows] = await db.query('SELECT * FROM packs');

                for (const row in rows) {
                    if (rows[row].all_owns) {
                        rows[row].owns = true;
                    } else {
                        rows[row].owns = await userOwns(db, request.user.claims.sub, row.id);
                    }
                    delete rows[row].all_owns;
                    rows[row].activities = (await db.query('SELECT id FROM activities WHERE pack = ?', [rows[row].id]))[0].length;
                }

                response.send({
                    code: 200,
                    message: 'OK',
                    data: rows,
                });
            } catch (err) {
                response.send({
                    code: 500,
                    message: err.message,
                    data: null,
                });
            }
        } else {
            response.send({
                code: 401,
                message: 'Unauthorized',
                data: null
            });
        }
    });

    app.get('/packs/owns', withLogto(config), async (request, response) => {
        response.setHeader('content-type', 'application/json');

        if (isAuthenticated(request.user)) {
            response.send({
                code: 200,
                message: "OK",
                data: await userOwns(db, request.user.claims.sub, request.query.pack)
            });
        } else {
            response.send({
                code: 401,
                message: "Unauthorized",
                data: null
            });
        }
    });

    app.get('/packs/purchase', withLogto(config), async (request, response) => {
        /**
         * Reasons:
         * 0 - Testing purposes (Temp)
         * 1 - Purchased
         * 2 - Gifted
         */
        response.setHeader('content-type', 'application/json');

        if (isAuthenticated(request.user)) {
            const stripe = new Stripe(process.env.STRIPE_KEY);

            const [row] = await db.execute('SELECT * FROM packs WHERE id = ?', [request.query.pack]);

            if (row.length === 0) {
                response.send({
                    code: 404,
                    message: "Not Found",
                    data: null
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
        } else {
            response.send({
                code: 401,
                message: "Unauthorized",
                data: null
            })
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