const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
function norm(jid){ return jid.split('@')[0].split(':')[0] }

async function isAdmin(sock, jid, senderId){
  try{
    const meta=await sock.groupMetadata(jid)
    const sNorm=norm(senderId)
    for(const p of meta.participants){
      if((norm(p.id)===sNorm || p.id===senderId) && p.admin) return true
    }
    return false
  }catch{ return false }
}

module.exports={
  name:"tagall",
  react:"📢",
  alias:["tag","everyone","hidetag"],
  category:"group",
  desc:"Tagall - box style",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`❌ Group only\n\n${WATERMARK}`},{quoted:m})

    const sender=m.key.participant || m.key.remoteJid
    const isOwner=m.key.fromMe
    const admin=await isAdmin(sock, jid, sender)
    if(!isOwner && !admin){
      await sock.sendMessage(jid,{react:{text:"❌",key:m.key}})
      return sock.sendMessage(jid,{text:`❌ Only Admins / Owner\n\n${WATERMARK}`},{quoted:m})
    }

    await sock.sendMessage(jid,{react:{text:"📢",key:m.key}})

    try{
      const meta=await sock.groupMetadata(jid)
      const participants=meta.participants
      const botName=global.botName || "META-AI"

      let msg=args.join(" ").trim()
      if(!msg){
        const quoted=m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || ""
        msg=quoted || "Hello everyone 👋🏽"
      }

      // Header
      let text=`╭───❒ *${botName}* ❒───╮\n`
      text+=`│\n`
      text+=`│ 📢 *GROUP:* ${meta.subject}\n`
      text+=`│ 👥 *MEMBERS:* ${participants.length}\n`
      text+=`│\n`
      text+=`│ 💬 *MESSAGE:*\n`
      text+=`│ ${msg}\n`
      text+=`│\n`

      // Members list numbered
      for(let i=0;i<participants.length;i++){
        const pId=participants[i].id
        text+=`│${i+1}. 👋🏽 @${norm(pId)}\n`
      }

      text+=`│\n`
      text+=`╰───────────────❒\n\n`
      text+=`${WATERMARK}`

      const mentions=participants.map(p=>p.id)

      await sock.sendMessage(jid,{text, mentions},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log("TAGALL BOX ERR", e)
      await sock.sendMessage(jid,{text:`❌ ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
