import type { LogtoExpressConfig } from '@logto/express';

export const config: LogtoExpressConfig = {
    appId: process.env.OIDC_CLIENT_ID,
    appSecret: process.env.OIDC_SECRET,
    endpoint: process.env.APP_HTTP_PROTOCOL+'://'+process.env.OIDC_BASE,
    baseUrl: process.env.APP_HTTP_PROTOCOL+'://'+process.env.APP_BASE
};

export function handleAuthRoute (request, res) {
    if (request.user.isAuthenticated) {
        res.send({
            'authed': true,
            'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
            'profile': request.user.claims
        });
    } else {
        res.send({
            'authed': true,
            'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
            'profile': request.user.claims
        });
    }
}