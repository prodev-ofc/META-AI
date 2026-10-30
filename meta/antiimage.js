const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../database/antiimage.json')

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
  name: "antiimage",
  alias: ["antiimg","noimg","noimage","antiimages"],
  category: "Group",
  react: "🖼️",
  desc: "Delete images in group",

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
      const act = db[jid]?.action || "delete"
      return await sock.sendMessage(jid, { 
        text: `╭─ [ ANTI IMAGE ] ─\n│ Status: ${enabled}\n│ Action: ${act}\n│\n│ .antiimage on/off/kick\n╰────────────` 
      }, { quoted: m })
    }

    // Admin check for on/off
    try{
      const meta = await sock.groupMetadata(jid)
      if(!isSenderAdmin(meta.participants, sender)){
        return await sock.sendMessage(jid, { text: "❌ Only admins!" }, { quoted: m })
      }
      if(!isBotAdmin(meta.participants, sock.user.id)){
        await sock.sendMessage(jid, { text: "⚠️ I'm not admin, setting saved. Make me admin to delete." }, { quoted: m })
      }
    }catch{}

    if(action === "on" || action === "enable"){
      db[jid] = { enabled: true, action: db[jid]?.action || "delete" }
      saveDB(db)
      return await sock.sendMessage(jid, { text: "✅ *Anti-Image ENABLED*\nImages will be deleted" }, { quoted: m })
    }
    if(action === "off" || action === "disable"){
      db[jid] = { enabled: false, action: "delete" }
      saveDB(db)
      return await sock.sendMessage(jid, { text: "❌ *Anti-Image DISABLED*" }, { quoted: m })
    }
    if(["kick","warn","delete"].includes(action)){
      db[jid] = { enabled: true, action }
      saveDB(db)
      return await sock.sendMessage(jid, { text: `✅ Action set to *${action.toUpperCase()}*` }, { quoted: m })
    }
  },

  // Call this from index.js
  async handleAntiImage(sock, m){
    try{
      const jid = m.key?.remoteJid || m.chat
      if(!jid?.endsWith('@g.us')) return false
      const db = loadDB()
      if(!db[jid]?.enabled) return false

      const msgType = Object.keys(m.message || {})[0]
      const hasImage = msgType === "imageMessage" || m.message?.imageMessage
      if(!hasImage) return false

      const sender = m.key.participant || m.participant || m.sender
      try{
        const meta = await sock.groupMetadata(jid)
        if(isSenderAdmin(meta.participants, sender)) return false
        if(!isBotAdmin(meta.participants, sock.user.id)) return false
      }catch{ return false }

      try{ await sock.sendMessage(jid, { delete: m.key }) }catch{}

      if(db[jid].action === "kick"){
        try{ await sock.groupParticipantsUpdate(jid, [sender], "remove") }catch{}
      }

      await sock.sendMessage(jid, {
        text: `🖼️ *Anti-Image* @${sender.split('@')[0]} Image deleted!`,
        mentions: [sender]
      })
      return true
    }catch{ return false }
  }
}
