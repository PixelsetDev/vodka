import {userOwns} from "./packs.js";

export async function createNewGame(db, uuid, mode, packs, bsPlayers) {
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
            await db.query("INSERT INTO games (id, code, host, state, mode, packs, players) VALUES (?,?,?,?,?,?,'[?]')", [null, code, uuid, 0, mode, packs, bsPlayers]);
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
        const [rows] = await db.query("SELECT * FROM games WHERE code = ? AND host = ?", [code, host]);

        return rows;
    } catch (err) {
        console.error(err);
        return [null];
    }
}

export async function getGameQuestions(db, code, host) {
    try {
        const [gameRows] = await db.query("SELECT * FROM games WHERE code = ? AND host = ?", [code, host]);
        const [questionRows] = await db.query("SELECT * FROM content WHERE pack = ?", [[gameRows][0].packs]);

        return questionRows;
    } catch (err) {
        console.error(err);
        return [null];
    }
}

export async function updateGameState(db, code, host) {
    try {
        const [rows] = await db.query("SELECT * FROM games WHERE code = ? AND host = ?", [code, host]);
        await db.query("UPDATE games SET state = ? WHERE code = ? AND host = ?", [[rows][0].state + 1, code, host]);
    } catch (err) {
        console.error(err);
        return [null];
    }
}