const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports={
  name:"vv", react:"👁️", category:"owner", alias:["v","view","rv","viewonce"], desc:"Retrieve view once message",
  execute: async (sock,m,args)=>{

    const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if(!q){
      return await sock.sendMessage(m.key.remoteJid,{text:"*VV* 👁️\n\nReply to a view-once with .vv"}, {quoted:m})
    }

    await sock.sendMessage(m.key.remoteJid,{react:{text:"👁️",key:m.key}})

    try{
      // 1. Unwrap all viewOnce layers
      let inner = q.viewOnceMessageV2Extension?.message || q.viewOnceMessageV2?.message || q.viewOnceMessage?.message || null
      
      // Some phones send imageMessage.viewOnce directly
      if(!inner){
        if(q.imageMessage?.viewOnce || q.videoMessage?.viewOnce || q.audioMessage?.viewOnce){
          inner = q
        } else {
          return await sock.sendMessage(m.key.remoteJid,{text:"❌ That is not a view once"}, {quoted:m})
        }
      }

      // 2. Download buffer - REAL method
      let buffer = await downloadMediaMessage(
        { message: inner },
        'buffer',
        {},
        { logger: { level: 'silent' }, reuploadRequest: sock.updateMediaMessage }
      )

      if(!buffer) throw new Error("Empty buffer")

      const type = Object.keys(inner)[0]
      const content = inner[type]
      const caption = content?.caption || ""

      if(type === 'imageMessage'){
        await sock.sendMessage(m.key.remoteJid, { image: buffer, caption: caption ? `${caption}\n\n> > *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ _PRODEV ZW_*` : "> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ _PRODEV ZW_*" }, {quoted:m})
      } else if(type === 'videoMessage'){
        await sock.sendMessage(m.key.remoteJid, { video: buffer, caption: caption || "👁️ ViewOnce Retrieved", mimetype: 'video/mp4' }, {quoted:m})
      } else if(type === 'audioMessage'){
        await sock.sendMessage(m.key.remoteJid, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: content.ptt || false }, {quoted:m})
      }

      await sock.sendMessage(m.key.remoteJid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log("VV ERR", e)
      await sock.sendMessage(m.key.remoteJid,{text:`❌ Failed: ${e.message}\n\nTry: Reply directly, not forwarded viewonce`}, {quoted:m})
    }
  }
}
