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
         try { await fs.unlink(tempFilePath) } catch (_) {}
         throw error
      }
   }

   try {
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      memoryData = (typeof parsed === 'object' && parsed !== null) ? parsed : {}
   } catch (error) {
      if (error.code === 'ENOENT') {
         await writeToDisk({})
      } else {
         console.error('Error reading database file, starting fresh:', error)
         memoryData = {}
      }
   }

   const save = async (data) => {
      const previousLock = writeLock
      let releaseLock
      writeLock = new Promise(resolve => { releaseLock = resolve })
      
      await previousLock

      try {
         memoryData = { ...memoryData, ...data }
         await writeToDisk(memoryData)
         return { status: 'saved', data }
      } catch (error) {
         console.error('Error saving data:', error)
         return { status: 'error', error }
      } finally {
         releaseLock()
      }
   }

   const fetch = async () => {
      return memoryData
   }

   return { save, fetch }
}

module.exports = { createDatabase }