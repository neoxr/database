const path = require('path')
const Database = require('better-sqlite3')

const createDatabase = (databaseFile = 'database') => {
   const dbPath = path.resolve(process.cwd(), databaseFile + '.db')

   const db = new Database(dbPath)

   db.prepare(`
      CREATE TABLE IF NOT EXISTS data (
         id TEXT PRIMARY KEY,
         content TEXT
      )
   `).run()

   const selectStmt = db.prepare('SELECT content FROM data WHERE id = ?')
   const updateStmt = db.prepare('UPDATE data SET content = ? WHERE id = ?')
   const insertStmt = db.prepare('INSERT INTO data (id, content) VALUES (?, ?)')

   const save = (data, id = '1') => {
      const content = JSON.stringify(data)
      let status = ''

      const transaction = db.transaction(() => {
         const row = selectStmt.get(id)
         if (row) {
            updateStmt.run(content, id)
            status = 'updated'
         } else {
            insertStmt.run(id, content)
            status = 'inserted'
         }
      })

      try {
         transaction()
         return { status, id, content }
      } catch (error) {
         console.error(`Gagal menyimpan data untuk id ${id}:`, error)
         throw error
      }
   }

   const fetch = (id = '1') => {
      try {
         const row = selectStmt.get(id)
         return row ? JSON.parse(row.content) : {}
      } catch (error) {
         console.error(`Gagal mengambil data untuk id ${id}:`, error)
         return {}
      }
   }

   const close = () => {
      db.close()
   }

   return { save, fetch, close }
}

module.exports = { createDatabase }