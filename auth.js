export const config = {
    appId: process.env.OIDC_CLIENT_ID,
    appSecret: process.env.OIDC_SECRET,
    endpoint: process.env.APP_HTTP_PROTOCOL+'://'+process.env.OIDC_BASE,
    baseUrl: process.env.APP_HTTP_PROTOCOL+'://'+process.env.APP_BASE
};

export function isAuthenticated(user) {
    if (user.isAuthenticated) {
        console.log("authenticated");
        let roles = user.claims.roles;

        console.log(roles);
        if (roles instanceof Array) {
            console.log("array");
            if (roles.includes("D3:ACCESS_PREPROD")) {
                console.log("includes");
                return true;
            }
        }
    }

    return false;
}