const sqlite3 = require('sqlite3')

const createDatabase = (databaseFile = 'database') => {
   const db = new sqlite3.Database(`${databaseFile}.db`)

   const runQuery = (query, params = []) =>
      new Promise((resolve, reject) => {
         db.run(query, params, function (err) {
            if (err) reject(err)
            else resolve(this)
         })
      })

   const fetchQuery = (query, params = []) =>
      new Promise((resolve, reject) => {
         db.get(query, params, (err, row) => {
            if (err) reject(err)
            else resolve(row)
         })
      })

   const createTable = () =>
      runQuery(`
         CREATE TABLE IF NOT EXISTS data (
            id TEXT PRIMARY KEY,
            content TEXT
         )
      `)

   const save = async (data, id = '1') => {
      await createTable()
      const existing = await fetchQuery(`SELECT * FROM data WHERE id = ?`, [id])
      const content = JSON.stringify(data)

      if (existing) {
         await runQuery(`UPDATE data SET content = ? WHERE id = ?`, [content, id])
         return { status: 'updated', id, content }
      } else {
         await runQuery(`INSERT INTO data (id, content) VALUES (?, ?)`, [id, content])
         return { status: 'inserted', id, content }
      }
   }

   const fetch = async (id = '1') => {
      await createTable()
      const row = await fetchQuery(`SELECT * FROM data WHERE id = ?`, [id])
      return row ? JSON.parse(row.content) : {}
   }

   return { save, fetch }
}

module.exports = { createDatabase }