const mysql = require('mysql2/promise')

const createDatabase = async ({
   uri = '',
   table = 'database'
} = {}) => {
   if (!uri) {
      throw new Error('Database URI is required')
   }

   const connection = await mysql.createConnection(uri)

   await connection.execute(`
      CREATE TABLE IF NOT EXISTS ${table} (
         id VARCHAR(255) PRIMARY KEY,
         content TEXT NOT NULL
      )
   `)

   const save = async (data, id = '1') => {
      try {
         const content = JSON.stringify(data)

         const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE id = ?`, [id])
         if (rows.length > 0) {
            await connection.execute(`UPDATE ${table} SET content = ? WHERE id = ?`, [content, id])
            return { status: 'updated', id, data }
         } else {
            await connection.execute(`INSERT INTO ${table} (id, content) VALUES (?, ?)`, [id, content])
            return { status: 'inserted', id, data }
         }
      } catch (error) {
         console.error('Error saving data:', error)
         return { status: 'error', error }
      }
   }

   const fetch = async (id = '1') => {
      try {
         const [rows] = await connection.execute(`SELECT content FROM ${table} WHERE id = ?`, [id])
         if (rows.length > 0) {
            return JSON.parse(rows[0].content)
         }
         return {}
      } catch (error) {
         console.error('Error fetching data:', error)
         return {}
      }
   }

   return { save, fetch }
}

module.exports = { createDatabase }