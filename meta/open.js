module.exports={
  name:"open", react:"🔓", category:"group", alias:["unlock","open-group","unmute"], desc:"Open group (all members can send)",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    if(!chatId.endsWith('@g.us')) return await sock.sendMessage(chatId,{text:"❌ Group only"}, {quoted:m})
    try{
      const groupMeta=await sock.groupMetadata(chatId)
      const senderId=m.key.participant || m.key.remoteJid
      const isAdmin=groupMeta.participants.some(p=>p.id===senderId && p.admin)
      if(!isAdmin) return await sock.sendMessage(chatId,{text:"❌ Admin only"}, {quoted:m})
      
      await sock.sendMessage(chatId,{react:{text:"🔓",key:m.key}})
      await sock.groupSettingUpdate(chatId, 'not_announcement')
      await sock.sendMessage(chatId,{text:"*🔓 GROUP OPENED*\n\nAll members can send messages now"}, {quoted:m})
      await sock.sendMessage(chatId,{react:{text:"✅",key:m.key}})
    }catch(e){
      await sock.sendMessage(chatId,{text:`❌ Failed: ${e.message}`}, {quoted:m})
    }
  }
}
