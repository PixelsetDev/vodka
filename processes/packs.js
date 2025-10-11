export async function userOwns(db, uuid, packID) {
    try {
        const [packs] = await db.execute('SELECT * FROM packs WHERE status = 1 AND default = 1');
        if (packs.length !== 0) { return true; }

        const [purchases] = await db.execute('SELECT * FROM purchases WHERE uuid = ? AND pack = ?', [uuid, packID]);
        return purchases.length !== 0;
    } catch (err) {
        return false;
    }
}