const { MongoClient } = require('mongodb')
const { stringify, parse } = require('flatted')

const createDatabase = async (uri = '', db_name = 'database', col_name = 'data') => {
   if (!uri) {
      throw new Error('Database URI is required')
   }

   let client
   let collection

   try {
      client = new MongoClient(uri, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
         serverSelectionTimeoutMS: 5000
      })
      await client.connect()

      const db = client.db(db_name)
      collection = db.collection(col_name)

      const collections = await db.listCollections().toArray()
      const exists = collections.some(col => col.name === col_name)
      if (!exists) {
         await db.createCollection(col_name)
      }
   } catch (error) {
      console.error('Error connecting to MongoDB or initializing the collection:', error)
      throw error
   }

   const save = async (data, id = 1) => {
      try {
         const serialized = stringify(data) // convert untuk menghindari siklik
         const filter = { _id: id }
         const update = { $set: { content: serialized } }
         const options = { upsert: true }
         await collection.updateOne(filter, update, options)
         return { status: 'saved', id, data }
      } catch (error) {
         console.error('Error saving data:', error)
         return { status: 'error', error }
      }
   }

   const fetch = async (id = 1) => {
      try {
         const document = await collection.findOne({ _id: id }, { projection: { content: 1 } })
         return document ? parse(document.content) : {}
      } catch (error) {
         console.error('Error fetching data:', error)
         return {}
      }
   }

   const reset = async () => {
      try {
         await collection.deleteMany({})
         return { status: 'reset', message: 'All data has been deleted.' }
      } catch (error) {
         console.error('Error resetting data:', error)
         return { status: 'error', error }
      }
   }

   return { save, fetch, reset }
}

module.exports = { createDatabase }