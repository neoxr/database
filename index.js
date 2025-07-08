const { MongoClient } = require('mongodb')
const { stringify, parse } = require('flatted')

const CHUNK_SIZE = 1 * 1024 * 1024

const createDatabase = async (uri = '', db_name = 'database') => {
   if (!uri) {
      throw new Error('Database URI is required')
   }

   let client
   try {
      client = new MongoClient(uri)
      await client.connect()
   } catch (error) {
      console.error('Error connecting to MongoDB. NOTE: Transactions require a Replica Set.', error)
      throw error
   }

   const db = client.db(db_name)
   const collection = db.collection('data')

   const save = async (data) => {
      const session = client.startSession()
      try {
         const serializedData = stringify(data)
         const chunks = []
         for (let i = 0; i < serializedData.length; i += CHUNK_SIZE) {
            chunks.push(serializedData.substring(i, i + CHUNK_SIZE))
         }

         const documentsToInsert = chunks.map((chunk, index) => ({
            _id: `db_chunk_${index}`,
            chunk: chunk
         }))

         await session.withTransaction(async () => {
            await collection.deleteMany({}, { session })
            
            if (documentsToInsert.length > 0) {
               await collection.insertMany(documentsToInsert, { session })
            }
         })
         
         return { status: 'saved', id: 1, data }
      } catch (error) {
         console.error('Error during save transaction:', error)
         return { status: 'error', error }
      } finally {
         await session.endSession()
      }
   }

   const fetch = async () => {
      try {
         const chunks = await collection.find({}).sort({ _id: 1 }).toArray()

         if (chunks.length === 0) {
            return {}
         }

         const serializedData = chunks.map(c => c.chunk).join('')

         return parse(serializedData)
         
      } catch (error) {
         console.error(`Error fetching or parsing data:`, error)
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
   
   const close = async () => {
       await client.close()
   }

   return { save, fetch, reset, close }
}

module.exports = { createDatabase }