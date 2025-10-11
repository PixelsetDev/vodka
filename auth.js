import {UserScope} from "@logto/express";

export const config = {
    appId: process.env.OIDC_CLIENT_ID,
    appSecret: process.env.OIDC_SECRET,
    endpoint: process.env.APP_HTTP_PROTOCOL+'://'+process.env.OIDC_BASE,
    baseUrl: process.env.APP_HTTP_PROTOCOL+'://'+process.env.APP_BASE,
    scopes: [UserScope.Email, UserScope.Profile, UserScope.Roles]
};

export function isAuthenticated(user) {
    if (user.isAuthenticated) {
        let roles = user.claims.roles;

        if (roles instanceof Array) {
            if (roles.includes("D3:ACCESS_PREPROD")) {
                return true;
            }
        }
    }

    return false;
}