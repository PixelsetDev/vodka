import {routeAccount} from "./account.js";
import {routePacks} from "./packs.js";
import {routeHome} from "./home.js";

export function loadRoutes (app, db) {
    routeHome(app)
    routeAccount(app);
    routePacks(app, db);
}