import {userOwns} from "./packs.js";

export async function getAllActivities(db, uuid, packs) {
    const activities = [];

    for (const pack of packs) {
        const owns = await userOwns(db, uuid, pack);
        if (!owns) {
            const [rows] = await db.query(
                "SELECT * FROM activities WHERE pack = ?",
                [pack]
            );

            activities.push(...rows);
        }
    }

    return activities;
}
