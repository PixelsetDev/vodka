import {userOwns} from "./packs.js";

export async function getAllActivities(db, uuid, packs) {
    const activities = [];

    for (const pack of packs) {
        const owns = await userOwns(db, uuid, pack);
        if (owns) {
            const [rows] = await db.query("SELECT `heading`,`subheading`,`responses`,`skip` FROM activities WHERE pack = ?", [pack]);

            for (let row in rows) {
                rows[row].responses = JSON.parse(rows[row].responses);
                rows[row].pack = pack;
            }
            activities.push(...rows);
        }
    }

    return activities;
}
