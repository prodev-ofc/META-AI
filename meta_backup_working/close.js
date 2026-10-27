module.exports={
  name:"close", react:"🔒", category:"group", alias:["lock","close-group","mute"], desc:"Close group (only admins can send)",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    if(!chatId.endsWith('@g.us')) return await sock.sendMessage(chatId,{text:"❌ Group only"}, {quoted:m})
    try{
      const groupMeta=await sock.groupMetadata(chatId)
      const senderId=m.key.participant || m.key.remoteJid
      const isAdmin=groupMeta.participants.some(p=>p.id===senderId && p.admin)
      if(!isAdmin) return await sock.sendMessage(chatId,{text:"❌ Admin only"}, {quoted:m})
      
      await sock.sendMessage(chatId,{react:{text:"🔒",key:m.key}})
      await sock.groupSettingUpdate(chatId, 'announcement')
      await sock.sendMessage(chatId,{text:"*🔒 GROUP CLOSED*\n\nOnly admins can send messages now"}, {quoted:m})
      await sock.sendMessage(chatId,{react:{text:"✅",key:m.key}})
    }catch(e){
      await sock.sendMessage(chatId,{text:`❌ Failed: ${e.message}`}, {quoted:m})
    }
  }
}
