module.exports={
  name:"vv", react:"👁️", category:"owner", alias:["v","view","rv","viewonce"], desc:"Retrieve view once message",
  execute: async (sock,m,args)=>{
    const quoted=m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if(!quoted){
      return await sock.sendMessage(m.key.remoteJid,{text:"*VV* 👁️\n\nReply to a view-once image/video/voice with .vv\n\nEg: reply to view once then type .vv"}, {quoted:m})
    }

    const viewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension
    const inner = viewOnce?.message
    if(!inner){
      // Sometimes it's directly imageMessage with viewOnce true
      const direct = quoted.imageMessage?.viewOnce || quoted.videoMessage?.viewOnce || quoted.audioMessage?.viewOnce
      if(!direct){
        return await sock.sendMessage(m.key.remoteJid,{text:"❌ That is not a view once message"}, {quoted:m})
      }
    }

    await sock.sendMessage(m.key.remoteJid,{react:{text:"👁️",key:m.key}})

    try{
      // Forward the inner message as normal
      const msgToForward = inner || quoted
      // Remove viewOnce flag
      if(msgToForward.imageMessage){
        msgToForward.imageMessage.viewOnce=false
        await sock.sendMessage(m.key.remoteJid,{image: msgToForward.imageMessage, caption: msgToForward.imageMessage.caption||""}, {quoted:m})
      } else if(msgToForward.videoMessage){
        msgToForward.videoMessage.viewOnce=false
        await sock.sendMessage(m.key.remoteJid,{video: msgToForward.videoMessage, caption: msgToForward.videoMessage.caption||""}, {quoted:m})
      } else if(msgToForward.audioMessage){
        msgToForward.audioMessage.viewOnce=false
        await sock.sendMessage(m.key.remoteJid,{audio: msgToForward.audioMessage, mimetype:'audio/mp4', ptt: msgToForward.audioMessage.ptt||false}, {quoted:m})
      } else {
        // Fallback copy
        await sock.sendMessage(m.key.remoteJid,{forward: {key: m.message.extendedTextMessage.contextInfo.stanzaId, message: quoted}}, {quoted:m})
        await sock.sendMessage(m.key.remoteJid,{text:"✅ Retrieved"}, {quoted:m})
      }
      await sock.sendMessage(m.key.remoteJid,{react:{text:"✅",key:m.key}})
    }catch(e){
      console.log("VV ERR", e)
      await sock.sendMessage(m.key.remoteJid,{text:`❌ Failed to retrieve: ${e.message}`}, {quoted:m})
    }
  }
}
