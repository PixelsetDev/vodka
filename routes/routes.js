import {routeAccount} from "./account.js";
import {routePacks} from "./packs.js";
import {routeHome} from "./home.js";
import {routeGameCreate} from "./game/create.js";
import {routeGameGet} from "./game/get.js";
import {routeGameUpdate} from "./game/update.js";

export function loadRoutes (app, db) {
    routeHome(app)
    routeAccount(app);
    routePacks(app, db);

    routeGameCreate(app, db);
    routeGameGet(app, db);
    routeGameUpdate(app, db);
}