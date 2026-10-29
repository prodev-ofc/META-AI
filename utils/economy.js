
const fs = require('fs')
const path = require('path')
const dbPath = path.join(__dirname, '../database/economy.json')
if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true })
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}')
function getDB(){ return JSON.parse(fs.readFileSync(dbPath)) }
function saveDB(data){ fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)) }
function getUser(jid){
  const db = getDB()
  if (!db[jid]){ db[jid] = { wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, lastBeg: 0, lastRob: 0, lastCrime: 0 }; saveDB(db) }
  return db[jid]
}
function updateUser(jid, data){
  const db = getDB()
  db[jid] = { ...getUser(jid), ...data }
  saveDB(db)
  return db[jid]
}
module.exports = { getDB, saveDB, getUser, updateUser }
