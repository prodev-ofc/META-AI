const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
function norm(jid){ return jid.split('@')[0].split(':')[0] }
async function isAdmin(sock, jid, senderId){
  try{
    const meta=await sock.groupMetadata(jid)
    const sNorm=norm(senderId)
    for(const p of meta.participants){
      const pNorm=norm(p.id)
      if((pNorm===sNorm || p.id===senderId) && p.admin) return true
    }
    return false
  }catch{ return false }
}
module.exports={
  name:"tagall",
  react:"📢",
  alias:["tag","everyone"],
  category:"group",
  desc:"Tag all - Admins/Owners only",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`❌ Group only\n\n${WATERMARK}`},{quoted:m})
    const sender=m.key.participant || m.key.remoteJid
    const isOwner=m.key.fromMe
    const admin=await isAdmin(sock, jid, sender)
    if(!isOwner && !admin){ await sock.sendMessage(jid,{react:{text:"❌",key:m.key}}); return sock.sendMessage(jid,{text:`❌ Only Admins / Owner\n\n${WATERMARK}`},{quoted:m}) }
    await sock.sendMessage(jid,{react:{text:"📢",key:m.key}})
    try{
      const meta=await sock.groupMetadata(jid)
      const participants=meta.participants.map(p=>p.id)
      let msg=args.join(" ").trim()
      if(!msg) msg=`*📢 TAGALL*\n${meta.subject}`
      let text=`${msg}\n\n`
      for(let i=0;i<participants.length;i++){ text+=`@${norm(participants[i])} `; if((i+1)%15===0) text+="\n" }
      text+=`\n\n${WATERMARK}`
      await sock.sendMessage(jid,{text,mentions:participants},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
    }catch(e){ await sock.sendMessage(jid,{text:`❌ ${e.message}\n\n${WATERMARK}`},{quoted:m}) }
  }
}
