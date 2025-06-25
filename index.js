const path = require('path')
const Database = require('better-sqlite3')

const createDatabase = (databaseFile = 'database') => {
   const dbPath = path.resolve(process.cwd(), databaseFile + '.db')

   const createTable = (db) => {
      db.prepare(`
         CREATE TABLE IF NOT EXISTS data (
            id TEXT PRIMARY KEY,
            content TEXT
         )
      `).run()
   }

   const save = (data, id = '1') => {
      const db = new Database(dbPath)
      try {
         createTable(db)
         const row = db.prepare(`SELECT * FROM data WHERE id = ?`).get(id)
         const content = JSON.stringify(data)

         if (row) {
            db.prepare(`UPDATE data SET content = ? WHERE id = ?`).run(content, id)
            return { status: 'updated', id, content }
         } else {
            db.prepare(`INSERT INTO data (id, content) VALUES (?, ?)`).run(id, content)
            return { status: 'inserted', id, content }
         }
      } finally {
         db.close()
      }
   }

   const fetch = (id = '1') => {
      const db = new Database(dbPath)
      try {
         createTable(db)
         const row = db.prepare(`SELECT * FROM data WHERE id = ?`).get(id)
         return row ? JSON.parse(row.content) : {}
      } finally {
         db.close()
      }
   }

   return { save, fetch }
}

module.exports = { createDatabase }