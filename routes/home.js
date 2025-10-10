export function routeHome (app) {
    app.get("/", (request, response) => {
        response.redirect(process.env.OIDC_POST_LOGIN_URL);
    });

    app.get("/status", (request, response) => {
        response.setHeader('content-type', 'application/json');
        if (process.env.APP_DEBUG === "true") {
            response.send({
                'app': 'D_VODKA_API', 'config': {
                    'APP_PORT': process.env.APP_PORT,
                    'APP_BASE': process.env.APP_BASE,
                    'APP_SECRET': '[REDACTED]',
                    'APP_HTTP_PROTOCOL': process.env.APP_HTTP_PROTOCOL,
                    'APP_DEBUG': process.env.APP_DEBUG,
                    'SQL_HOST': process.env.SQL_HOST,
                    'SQL_USER': process.env.SQL_USER,
                    'SQL_PASSWORD': '[REDACTED]',
                    'SQL_DATABASE': process.env.SQL_DATABASE,
                    'OIDC_BASE': process.env.OIDC_BASE,
                    'OIDC_CLIENT_ID': process.env.OIDC_CLIENT_ID,
                    'OIDC_SECRET': '[REDACTED]',
                    'OIDC_POST_LOGIN_URL': process.env.OIDC_POST_LOGIN_URL,
                    'STRIPE_KEY': '[REDACTED]',
                }
            });
        } else {
            response.send({
                'app': 'D_VODKA_API'
            });
        }
    });
}