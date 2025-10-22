import {userOwns} from "./packs.js";

export async function getAllActivities(db, uuid, packs) {
    const activities = [];

    console.log(`UUID,PACKS: ${uuid} ${packs.toString()}`);
    for (const pack of packs) {
        const owns = await userOwns(db, uuid, pack);
        console.log(`OWNS: ${owns}`);
        if (!owns) {
            const [rows] = await db.query(
                "SELECT * FROM activities WHERE pack = ?",
                [pack]
            );
            console.log(`ROWS: ${rows}`);

            activities.push(...rows);
        }
    }

    return activities;
}
