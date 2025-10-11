export async function userOwns(db, uuid, packID) {
    try {
        const [packs] = await db.execute('SELECT * FROM packs WHERE status = 1 AND all_owns = 1');
        console.log(packs);
        if (packs.length !== 0) { return true; }

        const [purchases] = await db.execute('SELECT * FROM purchases WHERE uuid = ? AND pack = ?', [uuid, packID]);
        console.log(purchases);
        return purchases.length !== 0;
    } catch (err) {
        console.error(err);
        return false;
    }
}