import {userOwns} from "./packs.js";

export async function createNewGame(db, uuid, type, packs) {
    if (!Array.isArray(packs)) {
        return -3;
    }

    for (let pack in packs) {
        if (!await userOwns(db, uuid, pack)) {
            return -1;
        }
    }

    try {
        const code = Math.floor(100000 + Math.random() * 900000);
        const [rows] = await db.query("SELECT * FROM games WHERE code = ?", [code]);

        if (rows.length === 0) {
            await db.query("INSERT INTO games (id, code, type, packs) VALUES (?,?,?,?)", [null, code, type, packs]);
            return code;
        } else {
            await createNewGame(db, uuid, type, packs);
        }
    } catch (err) {
        return -2;
    }
}

export async function fetchExistingGame(db, code) {
    try {
        const [rows] = await db.query("SELECT * FROM games WHERE code = ?", [code]);

        return rows;
    } catch (err) {
        return [null];
    }
}