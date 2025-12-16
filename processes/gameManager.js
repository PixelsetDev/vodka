import {userOwns} from "./packs.js";
import {getAllActivities} from "./activityManager.js";

export async function createNewGame(db, uuid, mode, packs, players) {
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
            await db.query("INSERT INTO games (id, code, host, state, mode, packs, players) VALUES (?,?,?,?,?,?,?)", [null, code, uuid, 0, mode, JSON.stringify(packs), JSON.stringify(players)]);
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
    const [rows] = await db.query(
        "SELECT `mode`,`host`,`packs`,`state` FROM games WHERE code = ? AND host = ?",
        [code, host]
    );

    if (rows.length === 0) {
        return {code: 404, message: "Game not found", data: []};
    }

    const game = rows[0];
    console.log(game);
    if (game.mode === 1) {
        try {
            game.packs = JSON.parse(game.packs);
        } catch (err) {
            console.error("VODKA > fetchExistingGame error - unable to parse packs:", err);
            return {code: 500, message: "Internal error", data: []};
        }
        try {
            if (game.players != null) {
                game.players = JSON.parse(game.players);
            }
        } catch (err) {
            console.error("VODKA > fetchExistingGame error - unable to parse players:", err);
            return {code: 500, message: "Internal error", data: []};
        }
        game.activities = await getAllActivities(db, game.host, game.packs);
    } else {
        game.activities = [];
    }

    return game;
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