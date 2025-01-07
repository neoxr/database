const fs = require('node:fs').promises
const path = require('path')

const createDatabase = async (filename = 'database') => {
   const filePath = path.join(process.cwd(), filename + '.json')

   const readFile = async () => {
      try {
         const content = await fs.readFile(filePath, 'utf-8')
         return JSON.parse(content)
      } catch (error) {
         if (error.code === 'ENOENT') {
            await writeFile({})
            return {}
         }
         console.error('Error reading file:', error)
         throw error
      }
   }

   const writeFile = async (data) => {
      try {
         await fs.writeFile(filePath, JSON.stringify(data))
      } catch (error) {
         console.error('Error writing file:', error)
         throw error
      }
   }

   const save = async (data, id = '1') => {
      try {
         const currentData = await readFile()
         currentData[id] = data
         await writeFile(currentData)
         return { status: 'saved', id, data }
      } catch (error) {
         console.error('Error saving data:', error)
         return { status: 'error', error }
      }
   }

   const fetch = async (id = '1') => {
      try {
         const currentData = await readFile()
         return currentData[id] || {}
      } catch (error) {
         console.error('Error fetching data:', error)
         return {}
      }
   }

   return { save, fetch }
}

module.exports = { createDatabase }