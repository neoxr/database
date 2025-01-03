const { MongoClient } = require('mongodb')

const createDatabase = async (uri = '', collectionName = 'database') => {
   if (!uri) {
      throw new Error('Database URI is required')
   }

   const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

   try {
      await client.connect()
      const dbName = uri.split('/').pop().split('?')[0] || 'data'
      const db = client.db(dbName)
      const collection = db.collection(collectionName)

      const save = async (data, id = '1') => {
         try {
            const content = JSON.stringify(data)
            const filter = { _id: id }
            const update = { $set: { content } }
            const options = { upsert: true }

            await collection.updateOne(filter, update, options)
            return { status: 'saved', id, data }
         } catch (error) {
            console.error('Error saving data:', error)
            return { status: 'error', error }
         }
      }

      const fetch = async (id = '1') => {
         try {
            const document = await collection.findOne({ _id: id })
            return document ? JSON.parse(document.content) : {}
         } catch (error) {
            console.error('Error fetching data:', error)
            return {}
         }
      }

      return { save, fetch }
   } catch (error) {
      console.error('Error connecting to MongoDB:', error)
      throw error
   } finally {
      client.close()
   }
}

module.exports = { createDatabase }