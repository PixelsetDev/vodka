export async function userOwns(db, uuid, packID) {
    try {
        const [rows] = await db.execute('SELECT * FROM purchases WHERE uuid = ? AND pack = ?', [uuid, packID]);

        return rows.length !== 0;
    } catch (err) {
        return false;
    }
}