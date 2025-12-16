import {userOwns} from "./packs.js";

export async function getAllActivities(db, uuid, packs) {
    const activities = [];

    for (const pack of packs) {
        const owns = await userOwns(db, uuid, pack);
        if (owns) {
            const [rows] = await db.query("SELECT `heading`,`subheading`,`responses`,`skip`,`persistent`,`type` FROM activities WHERE pack = ?", [pack]);

            for (let row in rows) {
                console.log(rows[row].responses);
                try {
                    rows[row].responses = JSON.parse(rows[row].responses);
                } catch (e) {
                    console.error("VODKA > getAllActivities error - unable to parse responses:", e);
                    return {code: 500, message: "Internal error", data: []};
                }
                try {
                    rows[row].persistent = JSON.parse(rows[row].persistent);
                } catch (e) {
                    console.error("VODKA > getAllActivities error - unable to parse persistent:", e);
                    return {code: 500, message: "Internal error", data: []};
                }
                rows[row].pack = pack;
            }
            activities.push(...rows);
        }
    }

    return activities;
}
