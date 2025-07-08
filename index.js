const { MongoClient } = require('mongodb')
const { stringify, parse } = require('flatted')

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

   const getCollectionName = (id) => `cyclic_data_store_${id}`

   const save = async (data, id = 1) => {
      const collectionName = getCollectionName(id)
      const collection = db.collection(collectionName)
      const session = client.startSession()

      try {
         const decycledArray = JSON.parse(stringify(data))

         const documentsToInsert = decycledArray.map((content, index) => ({
            _flatted_index: index,
            _flatted_content: content
         }))
         
         await session.withTransaction(async () => {
            await collection.deleteMany({}, { session })
            
            if (documentsToInsert.length > 0) {
               await collection.insertMany(documentsToInsert, { session })
            }
         })
         
         return { status: 'saved', id, data }
      } catch (error) {
         console.error(`Error during save transaction for ID ${id}:`, error)
         return { status: 'error', error }
      } finally {
         await session.endSession()
      }
   }

   const fetch = async (id = 1) => {
      try {
         const collectionName = getCollectionName(id)
         const collection = db.collection(collectionName)

         const cursor = collection.find({}, {
            projection: { _id: 0, _flatted_content: 1 }
         }).sort({ _flatted_index: 1 })

         const documentChunks = await cursor.toArray()

         if (documentChunks.length === 0) {
            return {}
         }

         const flattedArray = documentChunks.map(chunk => chunk._flatted_content)
         
         const reconstructedData = parse(flattedArray)

         return reconstructedData
         
      } catch (error) {
         console.error(`Error fetching data for ID ${id}:`, error)
         return {}
      }
   }

   const reset = async (id = 1) => {
      try {
         const collectionName = getCollectionName(id)
         await db.collection(collectionName).deleteMany({})
         return { status: 'reset', message: `Data for ID ${id} has been deleted.` }
      } catch (error) {
         console.error(`Error resetting data for ID ${id}:`, error)
         return { status: 'error', error }
      }
   }
   
   const close = async () => {
       await client.close()
   }

   return { save, fetch, reset, close }
}

module.exports = { createDatabase }