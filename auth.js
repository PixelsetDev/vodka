export const config = {
    appId: process.env.OIDC_CLIENT_ID,
    appSecret: process.env.OIDC_SECRET,
    endpoint: process.env.APP_HTTP_PROTOCOL+'://'+process.env.OIDC_BASE,
    baseUrl: process.env.APP_HTTP_PROTOCOL+'://'+process.env.APP_BASE
};