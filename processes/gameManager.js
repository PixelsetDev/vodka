import {userOwns} from "./packs.js";
import {getAllActivities} from "./activityManager.js";

export async function createNewGame(db, uuid, mode, packs) {
    if (!Array.isArray(packs)) {
        return -3;
    }

    for (let pack in packs) {
        if (!await userOwns(db, uuid, packs[pack])) {
            return -1;
        }
    }

    try {
        const code = Math.floor(100000 + Math.random() * 900000);
        const [rows] = await db.query("SELECT * FROM games WHERE code = ?", [code]);

        if (rows.length === 0) {
            await db.query("INSERT INTO games (id, code, host, state, mode, packs) VALUES (?,?,?,?,?,?)", [null, code, uuid, 0, mode, JSON.stringify(packs)]);
            return code;
        } else {
            await createNewGame(db, uuid, mode, packs);
        }
    } catch (err) {
        console.error(err);
        return -2;
    }
}

export async function fetchExistingGame(db, code, host) {
    try {
        const [rows] = await db.query(
            "SELECT `mode`,`host`,`packs`,`state` FROM games WHERE code = ? AND host = ?",
            [code, host]
        );

        if (rows.length === 0) {
            return { code: 404, message: "Game not found", data: [] };
        }

        const game = rows[0];
        if (game.mode === 1) {
            game.packs = JSON.parse(game.packs);
            game.players = JSON.parse(game.players);
            game.activities = await getAllActivities(db, game.host, game.packs);
        } else {
            game.activities = [];
        }

        return game;
    } catch (err) {
        console.error("VODKA > fetchExistingGame error:", err);
        return { code: 500, message: "Internal error", data: [] };
    }
}


export async function updateGameState(db, code, host) {
    try {
        const [rows] = await db.query("SELECT * FROM games WHERE code = ? AND host = ?", [code, host]);
        await db.query("UPDATE games SET state = ? WHERE code = ? AND host = ?", [rows[0].state+1, code, host]);
        return true;
    } catch (err) {
        console.error(err);
        return [null];
    }
}