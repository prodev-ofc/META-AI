const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../database/antispam.json')
const spamMap = new Map() // jid -> { user: [timestamps] }

function loadDB(){
  try{
    if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    if(!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}')
    return JSON.parse(fs.readFileSync(DB_PATH))
  }catch{ return {} }
}
function saveDB(d){ fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2)) }

function isBotAdmin(parts, botId){
  const num = botId.split(':')[0].split('@')[0]
  return parts.some(p => p.id.includes(num) && p.admin)
}
function isSenderAdmin(parts, sender){
  return parts.some(p => p.id === sender && p.admin)
}

module.exports = {
  name: "antispam",
  alias: ["antiflood","nospam"],
  category: "Group",
  react: "🚫",
  desc: "Delete if user sends 6+ msgs fast",

  async execute(sock, m, args){
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid

    if(!jid.endsWith('@g.us')){
      return await sock.sendMessage(jid, { text: "❌ Groups only!" }, { quoted: m })
    }

    const db = loadDB()
    const action = (args[0] || "status").toLowerCase()

    if(action === "status"){
      const enabled = db[jid]?.enabled ? "✅ ON" : "❌ OFF"
      return await sock.sendMessage(jid, {
        text: `╭─ [ ANTI SPAM ] ─\n│ Status: ${enabled}\n│ Limit: 5 msgs / 10 sec\n│ Action: 6th+ deleted\n│\n│ .antispam on/off\n╰────────────`
      }, { quoted: m })
    }

    try{
      const meta = await sock.groupMetadata(jid)
      if(!isSenderAdmin(meta.participants, sender)){
        return await sock.sendMessage(jid, { text: "❌ Admins only!" }, { quoted: m })
      }
      if(!isBotAdmin(meta.participants, sock.user.id)){
        await sock.sendMessage(jid, { text: "⚠️ Make me admin to delete spam" }, { quoted: m })
      }
    }catch{}

    if(action === "on" || action === "enable"){
      db[jid] = { enabled: true }
      saveDB(db)
      return await sock.sendMessage(jid, { text: "✅ *AntiSpam ENABLED*\nLimit: 5 msgs per 10s\n6th message will be deleted" }, { quoted: m })
    }
    if(action === "off" || action === "disable"){
      db[jid] = { enabled: false }
      saveDB(db)
      spamMap.delete(jid)
      return await sock.sendMessage(jid, { text: "❌ *AntiSpam DISABLED*" }, { quoted: m })
    }
  },

  // Call from index.js - must run BEFORE other handlers
  async handleAntiSpam(sock, m){
    try{
      const jid = m.key?.remoteJid
      if(!jid?.endsWith('@g.us')) return false
      const db = loadDB()
      if(!db[jid]?.enabled) return false

      const sender = m.key.participant || m.participant || m.sender
      if(!sender) return false

      // Ignore admins & bot
      try{
        const meta = await sock.groupMetadata(jid)
        if(isSenderAdmin(meta.participants, sender)) return false
        const botNum = sock.user.id.split(':')[0]
        if(sender.includes(botNum)) return false
        if(!isBotAdmin(meta.participants, sock.user.id)) return false
      }catch{ return false }

      const now = Date.now()
      const WINDOW = 10000 // 10 sec
      const LIMIT = 5 // 5 allowed, 6th deleted

      if(!spamMap.has(jid)) spamMap.set(jid, new Map())
      const groupMap = spamMap.get(jid)
      if(!groupMap.has(sender)) groupMap.set(sender, [])

      let timestamps = groupMap.get(sender).filter(t => now - t < WINDOW)
      timestamps.push(now)
      groupMap.set(sender, timestamps)

      // If 6 or more in window -> spam
      if(timestamps.length > LIMIT){
        try{ await sock.sendMessage(jid, { delete: m.key }) }catch{}

        // If user hit 6, warn once
        if(timestamps.length === LIMIT + 1){
          await sock.sendMessage(jid, {
            text: `🚫 *AntiSpam* @${sender.split('@')[0]} Stop spamming! ${LIMIT} msgs / 10s limit\nNext ${timestamps.length - LIMIT} spam msgs deleted`,
            mentions: [sender]
          })
        }

        // If very spammy (10+), kick/mute option
        if(timestamps.length >= 10){
          // Reset to avoid flood of warns
          groupMap.set(sender, [])
          await sock.sendMessage(jid, {
            text: `⚠️ @${sender.split('@')[0]} kicked for spam (10+ fast msgs)`,
            mentions: [sender]
          })
          // Uncomment to auto-kick:
          // try{ await sock.groupParticipantsUpdate(jid, [sender], "remove") }catch{}
        }
        return true
      }
      return false
    }catch(e){ console.log("[ANTISPAM]", e.message); return false }
  }
}
