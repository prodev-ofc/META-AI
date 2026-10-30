
module.exports={
  name:'grouplink',
  alias:['gclink','link','invite'],
  category:'group',
  react:'🔗',
  async execute(sock,m){
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:'❌ Group only'},{quoted:m})
    try{
      const meta=await sock.groupMetadata(jid)
      let pp=null; try{pp=await sock.profilePictureUrl(jid,'image')}catch{}
      let code=await sock.groupInviteCode(jid)
      let link=`https://chat.whatsapp.com/${code}`
      let cap=`╭─ [ GROUP LINK ]\n│ ${meta.subject}\n│ Members: ${meta.participants.length}\n│ Link: ${link}\n╰──────────`
      if(pp) await sock.sendMessage(jid,{image:{url:pp},caption:cap},{quoted:m})
      else await sock.sendMessage(jid,{text:cap},{quoted:m})
    }catch{ return sock.sendMessage(jid,{text:'❌ Bot must be admin'},{quoted:m}) }
  }
}
