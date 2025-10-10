import {routeAccount} from "./account.js";
import {routePacks} from "./packs.js";
import {routeHome} from "./home.js";
import {routeGameStart} from "./game/create";
import {routeGameFetch} from "./game/get";

export function loadRoutes (app, db) {
    routeHome(app)
    routeAccount(app);
    routePacks(app, db);

    routeGameStart(app, db);
    routeGameFetch(app, db);
}