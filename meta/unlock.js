module.exports={
  name:"unlock", react:"🔓", category:"group", alias:["open"], desc:"Unlock group (alias for open)",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    if(!chatId.endsWith('@g.us')) return await sock.sendMessage(chatId,{text:"❌ Group only"}, {quoted:m})
    try{
      const groupMeta=await sock.groupMetadata(chatId)
      const senderId=m.key.participant || m.key.remoteJid
      const isAdmin=groupMeta.participants.some(p=>p.id===senderId && p.admin)
      if(!isAdmin) return await sock.sendMessage(chatId,{text:"❌ Admin only"}, {quoted:m})
      await sock.groupSettingUpdate(chatId, 'not_announcement')
      await sock.sendMessage(chatId,{react:{text:"🔓",key:m.key}})
      await sock.sendMessage(chatId,{text:"*🔓 GROUP UNLOCKED*\nAll members can chat"}, {quoted:m})
    }catch(e){ await sock.sendMessage(chatId,{text:`❌ ${e.message}`}, {quoted:m}) }
  }
}
