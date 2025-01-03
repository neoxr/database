const { MongoClient } = require('mongodb')

const createDatabase = async (uri = '', collectionName = 'database') => {
   if (!uri) {
      throw new Error('Database URI is required')
   }

   let client
   let collection

   try {
      client = new MongoClient(uri, {
         useNewUrlParser: true,
         useUnifiedTopology: true
      })
      await client.connect()
      const db = client.db()
      collection = db.collection(collectionName)

      const collections = await db.listCollections().toArray()
      const exists = collections.some(col => col.name === collectionName)
      if (!exists) {
         await db.createCollection(collectionName)
      }
   } catch (error) {
      console.error('Error connecting to MongoDB or initializing the collection:', error)
      throw error
   }

   const save = async (data, id = '1') => {
      try {
         const filter = { _id: id }
         const update = { $set: { content: data } }
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
         return document ? document.content : {}
      } catch (error) {
         console.error('Error fetching data:', error)
         return {}
      }
   }

   return { save, fetch }
}

module.exports = { createDatabase }