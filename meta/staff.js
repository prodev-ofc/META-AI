const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

module.exports={
  name:"staff",
  react:"👮",
  alias:["admins","adminlist","stafflist"],
  category:"group",
  desc:"List group admins",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`Group only command\n\n${WATERMARK}`},{quoted:m})

    try{
      const groupMetadata = await sock.groupMetadata(jid)
      
      let pp
      try{ pp = await sock.profilePictureUrl(jid, 'image') }catch{ pp = null }

      const participants = groupMetadata.participants
      const groupAdmins = participants.filter(p => p.admin)
      
      if(!groupAdmins.length){
        return sock.sendMessage(jid,{text:`No admins found\n\n${WATERMARK}`},{quoted:m})
      }

      const listAdmin = groupAdmins.map((v,i)=> `${i+1}. @${v.id.split('@')[0]} ${v.admin==='superadmin' ? '(Owner 👑)' : ''}`).join('\n')
      const owner = groupMetadata.owner || groupAdmins.find(p=>p.admin==='superadmin')?.id

      const text = `≡ *GROUP STAFF* _${groupMetadata.subject}_\n\n┌─⊷ *ADMINS [${groupAdmins.length}]*\n${listAdmin}\n└───────────\n\n${WATERMARK}`.trim()

      const mentions = [...groupAdmins.map(v=>v.id)]
      if(owner && !mentions.includes(owner)) mentions.push(owner)

      if(pp){
        await sock.sendMessage(jid,{image:{url:pp}, caption:text, mentions},{quoted:m})
      } else {
        await sock.sendMessage(jid,{text, mentions},{quoted:m})
      }

    }catch(e){
      console.log('[staff] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Failed to get admin list: ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
