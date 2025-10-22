import {userOwns} from "./packs.js";

export async function getAllActivities(db, uuid, packs) {
    let activities = [];
    for (let pack in packs) {
        if (!await userOwns(db, uuid, packs[pack])) {
            activities.push(await db.query("SELECT * FROM activities WHERE pack = ?", [packs[pack]]));
        }
    }
    return activities;
}