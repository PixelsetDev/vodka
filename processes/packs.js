export async function userOwns(db, uuid, packID) {
    try {
        const packs = await new Promise((res, rej) =>
            db.query('SELECT * FROM packs WHERE status = 1 AND all_owns = 1', (err, rows) => err ? rej(err) : res(rows))
        );
        if (packs.length !== 0) return true;

        const purchases = await new Promise((res, rej) =>
            db.query('SELECT * FROM purchases WHERE uuid = ? AND pack = ?', [uuid, packID], (err, rows) => err ? rej(err) : res(rows))
        );
        return purchases.length !== 0;
    } catch (err) {
        console.error(err);
        return false;
    }
}