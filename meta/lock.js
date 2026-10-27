module.exports={
  name:"lock", react:"🔒", category:"group", alias:["close"], desc:"Lock group (alias for close)",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    if(!chatId.endsWith('@g.us')) return await sock.sendMessage(chatId,{text:"❌ Group only"}, {quoted:m})
    try{
      const groupMeta=await sock.groupMetadata(chatId)
      const senderId=m.key.participant || m.key.remoteJid
      const isAdmin=groupMeta.participants.some(p=>p.id===senderId && p.admin)
      if(!isAdmin) return await sock.sendMessage(chatId,{text:"❌ Admin only"}, {quoted:m})
      await sock.groupSettingUpdate(chatId, 'announcement')
      await sock.sendMessage(chatId,{react:{text:"🔒",key:m.key}})
      await sock.sendMessage(chatId,{text:"*🔒 GROUP LOCKED*\nOnly admins can chat"}, {quoted:m})
    }catch(e){ await sock.sendMessage(chatId,{text:`❌ ${e.message}`}, {quoted:m}) }
  }
}
