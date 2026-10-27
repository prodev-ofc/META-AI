const fs = require('fs')
const path = require('path')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
const DB_PATH = path.join(__dirname, '..', 'database', 'antidelete.json')
if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
if(!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({mode:"off"}))

let store = new Map()
let initialized = false

function getOwnerJid(){
  try{
    const cfg = require('../config.json')
    let n = cfg.ownerNumber || cfg.owner || cfg.ownerNumbers?.[0]
    if(Array.isArray(n)) n=n[0]
    if(n) return n.includes('@')?n:n.replace(/[^0-9]/g,'')+'@s.whatsapp.net'
  }catch{}
  return null
}

function initAntiDelete(sock){
  if(initialized) return
  initialized = true

  sock.ev.on('messages.upsert', async ({messages})=>{
    try{
      const db = JSON.parse(fs.readFileSync(DB_PATH))
      if(db.mode==="off") return
      for(const m of messages){
        if(!m.message) continue
        if(m.key.fromMe) continue
        
        let mediaBuffer = null
        let mediaType = null
        let mimetype = null
        
        // try download media immediately while it's still available
        try{
          const msgType = Object.keys(m.message)[0]
          if(['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage','viewOnceMessage','viewOnceMessageV2'].includes(msgType) || m.message.imageMessage || m.message.videoMessage){
            mediaBuffer = await downloadMediaMessage(m, 'buffer', {}, {reuploadRequest: sock.updateMediaMessage})
            if(m.message.imageMessage){ mediaType='image'; mimetype=m.message.imageMessage.mimetype }
            else if(m.message.videoMessage){ mediaType='video'; mimetype=m.message.videoMessage.mimetype }
            else if(m.message.audioMessage){ mediaType='audio'; mimetype=m.message.audioMessage.mimetype }
            else if(m.message.stickerMessage){ mediaType='sticker'; mimetype=m.message.stickerMessage.mimetype }
            else if(m.message.documentMessage){ mediaType='document'; mimetype=m.message.documentMessage.mimetype }
            else { mediaType='image'; }
          }
        }catch(e){ console.log("MEDIA SAVE FAIL", e.message) }

        store.set(m.key.id, { msg: m, buffer: mediaBuffer, mediaType, mimetype })
        if(store.size>1000){
          const first=store.keys().next().value
          store.delete(first)
        }
      }
    }catch(e){ console.log("UPsert ERR", e.message) }
  })

  sock.ev.on('messages.update', async (updates)=>{
    try{
      const db = JSON.parse(fs.readFileSync(DB_PATH))
      if(db.mode==="off") return
      for(const {key, update} of updates){
        const isDeleted = update.message===null || update.status===4 || update.messageStubType===1
        if(!isDeleted) continue
        
        const saved = store.get(key.id)
        if(!saved) continue
        const original = saved.msg
        const buffer = saved.buffer
        const mediaType = saved.mediaType
        
        const chatJid = key.remoteJid
        const sender = original.key.participant || key.participant || chatJid
        const senderNum = sender.split('@')[0]
        const isGroup = chatJid.endsWith('@g.us')
        
        let delType="Text"
        let content=""
        if(original.message.conversation){ delType="Text"; content=original.message.conversation }
        else if(original.message.extendedTextMessage){ delType="Text"; content=original.message.extendedTextMessage.text }
        else if(original.message.imageMessage){ delType="Image"; content=original.message.imageMessage.caption||"" }
        else if(original.message.videoMessage){ delType="Video"; content=original.message.videoMessage.caption||"" }
        else if(original.message.audioMessage){ delType=original.message.audioMessage.ptt?"Voice":"Audio" }
        else if(original.message.stickerMessage){ delType="Sticker" }
        else if(original.message.documentMessage){ delType="Document"; content=original.message.documentMessage.fileName||"" }
        else delType=mediaType||"Media"

        const box=`*╭┈───〔 🚫 ANTI-DELETE 〕┈───⊷*\n*├• 👤 Sender:* @${senderNum}\n*├• 🗂 Type:* ${delType}\n*├• 💬 Text:* ${content.substring(0,300) || "Media deleted"}\n*├• 📍 From:* ${isGroup ? "Group" : "Private"}\n*├• 🔄 Mode:* ${db.mode}\n*╰───────────────────⊷*\n\n${WATERMARK}`

        let targetJid = chatJid
        if(db.mode==="private"){
          const owner = getOwnerJid()
          if(owner) targetJid = owner
          else targetJid = sock.user.id
        }

        await sock.sendMessage(targetJid,{text:box, mentions:[sender]})

        // resend actual media with buffer
        try{
          if(buffer && mediaType){
            if(mediaType==='image'){
              await sock.sendMessage(targetJid,{image:buffer, caption: content ? `*Recovered Image*\n${content}\n\n${WATERMARK}` : `*Recovered Image*\n\n${WATERMARK}`})
            }else if(mediaType==='video'){
              await sock.sendMessage(targetJid,{video:buffer, caption: content ? `*Recovered Video*\n${content}\n\n${WATERMARK}` : `*Recovered Video*\n\n${WATERMARK}`})
            }else if(mediaType==='audio'){
              await sock.sendMessage(targetJid,{audio:buffer, mimetype: saved.mimetype || 'audio/mp4', ptt: original.message.audioMessage?.ptt || false})
            }else if(mediaType==='sticker'){
              await sock.sendMessage(targetJid,{sticker:buffer})
            }else if(mediaType==='document'){
              await sock.sendMessage(targetJid,{document:buffer, fileName: original.message.documentMessage?.fileName || 'file', mimetype: saved.mimetype || 'application/octet-stream'})
            }
          }else{
            // text or buffer missing - try forward
            await sock.copyNForward(targetJid, original, true)
          }
        }catch(e){
          console.log("RESEND FAIL", e.message)
          try{ await sock.copyNForward(targetJid, original, true) }catch{}
        }
      }
    }catch(e){ console.log("ANTIDEL UPDATE ERR", e.message) }
  })
}

module.exports={
  name:"antidelete",
  alias:["antidel","nodel","nodelete"],
  category:"owner",
  react:"🚫",
  async execute(sock,m,args){
    const jid=m.key.remoteJid
    const isOwner = m.key.fromMe
    if(!isOwner){
      return sock.sendMessage(jid,{text:`*╭┈───〔 🚫 ANTI-DELETE 〕┈───⊷*\n*├• ❌ Owner Only*\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    }
    initAntiDelete(sock)
    const db = JSON.parse(fs.readFileSync(DB_PATH))
    const cmd = (args[0]||"").toLowerCase()

    if(!cmd){
      const st = db.mode==="off" ? "OFF ❌" : db.mode==="private" ? "PRIVATE 📥 (Owner DM)" : "ON ✅ (Same Chat)"
      return sock.sendMessage(jid,{text:`*╭┈───〔 🚫 ANTI-DELETE 〕┈───⊷*\n*├• 📊 Status:* ${st}\n*├•\n*├• 📜 Commands:*\n*├• • .antidelete on - return in same chat\n*├• • .antidelete private - send to owner DM\n*├• • .antidelete off - disable\n*├• • Aliases: antidel, nodel, nodelete\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    }
    if(cmd==="on" || cmd==="chat"){
      db.mode="chat"
      fs.writeFileSync(DB_PATH, JSON.stringify(db))
      return sock.sendMessage(jid,{text:`*╭┈───〔 🚫 ANTI-DELETE 〕┈───⊷*\n*├• ✅ Enabled*\n*├• 🔄 Mode:* Same Chat\n*├• 📝 Media + Text will be recovered\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    }
    if(cmd==="private" || cmd==="dm"){
      db.mode="private"
      fs.writeFileSync(DB_PATH, JSON.stringify(db))
      return sock.sendMessage(jid,{text:`*╭┈───〔 🚫 ANTI-DELETE 〕┈───⊷*\n*├• ✅ Enabled*\n*├• 🔄 Mode:* Private (Owner DM)\n*├• 📝 All deleted media to your DM\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    }
    if(cmd==="off"){
      db.mode="off"
      fs.writeFileSync(DB_PATH, JSON.stringify(db))
      store.clear()
      return sock.sendMessage(jid,{text:`*╭┈───〔 🚫 ANTI-DELETE 〕┈───⊷*\n*├• ❌ Disabled*\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
