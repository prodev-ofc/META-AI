module.exports = {
  name: "listonline",
  alias: ["online", "active", "tagonline"],
  category: "group",
  desc: "Tag only truly online members",
  async execute(sock, m, args, commands){
    const cfg = require('../config')
    const { box } = require('../utils')
    
    if(!m.key.remoteJid.endsWith('@g.us')){
      return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, ["❌ Group only"]) }, { quoted: m })
    }
    
    try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "👀", key: m.key } }) }catch{}
    const sent = await sock.sendMessage(m.key.remoteJid, { text: box(cfg, ["🔍 Checking online...", "⏳ Scanning 5s..."]) }, { quoted: m })
    
    try{
      const groupMeta = await sock.groupMetadata(m.key.remoteJid)
      const participants = groupMeta.participants.map(p => p.id)
      
      const onlineMap = {}
      
      const handler = (json) => {
        for(let jid in json){
          const presence = json[jid]?.lastKnownPresence
          if(presence === 'available' || presence === 'composing' || presence === 'recording' || presence === 'available'){
            onlineMap[jid] = true
          }
        }
      }
      
      sock.ev.on('presence.update', handler)
      
      for(let jid of participants){
        try{ 
          await sock.presenceSubscribe(jid)
          await new Promise(r=>setTimeout(r, 80))
        }catch{}
      }
      
      await new Promise(r=>setTimeout(r, 5000))
      
      sock.ev.off('presence.update', handler)
      
      let onlineMembers = Object.keys(onlineMap).filter(j => participants.includes(j))
      
      if(onlineMembers.length === 0){
        return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, ["😴 No online members", `Total: ${participants.length}`, "Members may hide online privacy"]), edit: sent.key })
      }
      
      let txt = `╭─── META AI ───\n`
      txt += `│ 🟢 Online: ${onlineMembers.length}/${participants.length}\n`
      txt += `├──────────────\n`
      for(let j of onlineMembers){ txt += `│ @${j.split('@')[0]}\n` }
      txt += `╰──────────────\n> ✨️Meta AI by prodev`
      
      await sock.sendMessage(m.key.remoteJid, { text: txt, mentions: onlineMembers }, { quoted: m })
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`✅ ${onlineMembers.length} online tagged`]), edit: sent.key })
      try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } }) }catch{}
      
    }catch(e){
      console.log(e)
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`❌ ${e.message}`]), edit: sent.key })
    }
  }
}
