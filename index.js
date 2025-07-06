const fs = require('node:fs').promises
const path = require('path')

const createDatabase = async (filename = 'database') => {
   const filePath = path.join(process.cwd(), filename + '.json')
   const tempFilePath = filePath + '.tmp'

   let memoryData = {}
   let writeLock = Promise.resolve()

   const writeToDisk = async (data) => {
      try {
         await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf-8')
         await fs.rename(tempFilePath, filePath)
      } catch (error) {
         console.error('Fatal error writing to disk:', error)
         try { await fs.unlink(tempFilePath) } catch (_) { }
         throw error
      }
   }

   try {
      const content = await fs.readFile(filePath, 'utf-8')
      memoryData = JSON.parse(content)
   } catch (error) {
      if (error.code === 'ENOENT') {
         await writeToDisk({})
      } else {
         console.error('Error reading initial database file, it might be corrupt:', error)
         throw new Error('Failed to initialize database from a potentially corrupt file.')
      }
   }

   const save = async (data, id = '1') => {
      const previousLock = writeLock
      let releaseLock
      writeLock = new Promise(resolve => { releaseLock = resolve })

      await previousLock

      try {
         memoryData[id] = data
         await writeToDisk(memoryData)
         return { status: 'saved', id, data }
      } catch (error) {
         console.error('Error saving data:', error)
         return { status: 'error', error }
      } finally {
         releaseLock()
      }
   }

   const fetch = async (id = '1') => {
      const data = memoryData[id] || {}
      return data
   }

   return { save, fetch }
}

module.exports = { createDatabase }