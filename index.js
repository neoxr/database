const { Pool } = require('pg')

const createDatabase = async (uri = '', table = 'data') => {
   if (!uri) {
      throw new Error('Database URI is required')
   }

   const pool = new Pool({ connectionString: uri })

   try {
      const client = await pool.connect()
      await client.query(`
         CREATE TABLE IF NOT EXISTS "${table}" (
            id VARCHAR(255) PRIMARY KEY,
            content TEXT NOT NULL
         )
      `)
      client.release()
   } catch (error) {
      console.error('Error connecting to the database or creating the table:', error)
      throw error
   }

   const save = async (data, id = '1') => {
      try {
         const content = JSON.stringify(data)
         const client = await pool.connect()
         const result = await client.query(`SELECT id FROM "${table}" WHERE id = $1`, [id])
         if (result.rows.length > 0) {
            await client.query(`UPDATE "${table}" SET content = $1 WHERE id = $2`, [content, id])
            client.release()
            return { status: 'updated', id, data }
         } else {
            await client.query(`INSERT INTO "${table}" (id, content) VALUES ($1, $2)`, [id, content])
            client.release()
            return { status: 'inserted', id, data }
         }
      } catch (error) {
         console.error('Error saving data:', error)
         return { status: 'error', error }
      }
   }

   const fetch = async (id = '1') => {
      try {
         const client = await pool.connect()
         const result = await client.query(`SELECT content FROM "${table}" WHERE id = $1`, [id])
         client.release()
         if (result.rows.length > 0) {
            return JSON.parse(result.rows[0].content)
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