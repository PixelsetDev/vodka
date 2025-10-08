import type { LogtoExpressConfig } from '@logto/express';

export const config: LogtoExpressConfig = {
    appId: process.env.OIDC_CLIENT_ID,
    appSecret: process.env.OIDC_SECRET,
    endpoint: process.env.APP_HTTP_PROTOCOL+'://'+process.env.OIDC_BASE,
    baseUrl: process.env.APP_HTTP_PROTOCOL+'://'+process.env.APP_BASE
};

export function handleAuthRoute (req, request, res) {
    if (req.user.isAuthenticated) {
        if (process.env.APP_PORT !== "443") {
            res.send({
                'authed': true,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + ':' + process.env.APP_PORT + '/logto/sign-in',
                'profile': request.user.claims
            });
        } else {
            res.send({
                'authed': true,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
                'profile': request.user.claims
            });
        }
    } else {
        if (process.env.APP_PORT !== "443") {
            res.send({
                'authed': false,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + ':' + process.env.APP_PORT + '/logto/sign-in',
                'profile': null
            });
        } else {
            res.send({
                'authed': false,
                'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
                'profile': null
            });
        }
    }
}