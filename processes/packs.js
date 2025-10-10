export async function userOwns(db, uuid, packID) {
    try {
        const [rows] = await db.execute('SELECT * FROM purchases WHERE uuid = ? AND pack = ?', [uuid, packID]);

        console.log(rows);
        return rows.length !== 0;
    } catch (err) {
        return false;
    }
}