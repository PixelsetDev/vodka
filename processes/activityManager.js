import {userOwns} from "./packs.js";

export async function getAllActivities(db, uuid, packs, maxactivities) {
    const activities = [];

    const results = await Promise.all(
        packs.map(async pack => {
            const owns = await userOwns(db, uuid, pack);
            if (!owns) return [];

            const [rows] = await db.query(
                "SELECT `heading`,`subheading`,`responses`,`skip`,`persistent`,`type` FROM activities WHERE pack = ?",
                [pack]
            );

            for (let row of rows) {
                try {
                    row.responses = JSON.parse(row.responses);
                } catch (e) {
                    console.error("VODKA > getAllActivities error - unable to parse responses:", e);
                    return { code: 500, message: "Internal error", data: [] };
                }
                try {
                    row.persistent = JSON.parse(row.persistent);
                } catch (e) {
                    console.error("VODKA > getAllActivities error - unable to parse persistent:", e);
                    return { code: 500, message: "Internal error", data: [] };
                }
                row.pack = pack;
            }
            return rows;
        })
    );

    results.forEach(r => activities.push(...r));

    for (let i = activities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activities[i], activities[j]] = [activities[j], activities[i]];
    }

    return maxactivities && activities.length > maxactivities
        ? activities.slice(0, maxactivities)
        : activities;
}
