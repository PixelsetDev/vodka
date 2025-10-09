export function handleAuthRoute (request, response) {
    if (request.user.isAuthenticated) {
        response.send({
            'authed': true,
            'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
            'profile': request.user.claims
        });
    } else {
        response.send({
            'authed': true,
            'login-url': process.env.APP_HTTP_PROTOCOL+'://' + process.env.APP_BASE + '/logto/sign-in',
            'profile': request.user.claims
        });
    }
}