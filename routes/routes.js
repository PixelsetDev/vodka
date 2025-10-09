import {routeAccount} from "./account";
import {routePacks} from "./packs";
import {routeHome} from "./home";

export function loadRoutes (app, db) {
    routeHome(app)
    routeAccount(app);
    routePacks(app, db);
}