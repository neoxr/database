const admin = require('firebase-admin')

const createDatabase = (firebaseConfig, collectionName = 'database') => {
   admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
   })

   const firestore = admin.firestore()
   const collectionRef = firestore.collection(collectionName)

   const save = async (data, id = '1') => {
      try {
         const docRef = collectionRef.doc(id)
         const doc = await docRef.get()

         if (doc.exists) {
            await docRef.update(data)
            return { status: 'updated', id, data }
         } else {
            await docRef.set(data)
            return { status: 'inserted', id, data }
         }
      } catch (error) {
         console.error('Error saving data:', error)
         return { status: 'error', error }
      }
   }

   const fetch = async (id = '1') => {
      try {
         const doc = await collectionRef.doc(id).get()
         return doc.exists ? doc.data() : {}
      } catch (error) {
         console.error('Error fetching data:', error)
         return {}
      }
   }

   return { save, fetch }
}

module.exports = { createDatabase }