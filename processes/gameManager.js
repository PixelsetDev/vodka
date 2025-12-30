import {getAllActivities} from "./activityManager.js";

export async function createNewGame(db, uuid, mode) {
    try {
        await db.query("INSERT INTO games (id, host, mode, datetime) VALUES (?,?,?,?)", [null, uuid, mode, new Date().toLocaleString('en-GB').replace(',', '')]);
        return 200;
    } catch (err) {
        console.error(err);
        return -2;
    }
}

export async function fetchExistingGame(db, code, host) {
    const [rows] = await db.query(
        "SELECT `mode`,`host`,`packs`,`state`,`players`,`maxactivities` FROM games WHERE code = ? AND host = ?",
        [code, host]
    );

    if (rows.length === 0) {
        return {code: 404, message: "Game not found", data: []};
    }

    const game = rows[0];

    try {
        game.packs = JSON.parse(game.packs);
    } catch (err) {
        console.error("VODKA > fetchExistingGame error - unable to parse packs:", err);
        return {code: 500, message: "Internal error", data: []};
    }
    try {
        if (game.players != null) {
            game.players = JSON.parse(game.players);
            game.host = 0;
        }
    } catch (err) {
        console.error("VODKA > fetchExistingGame error - unable to parse players:", err);
        return {code: 500, message: "Internal error", data: []};
    }
    game.activities = await getAllActivities(db, game.host, game.packs, game.maxactivities);

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