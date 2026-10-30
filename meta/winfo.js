module.exports = {
  name: 'winfo',
  alias: ['whois','userinfo','gcinfo'],
  category: 'info',
  react: '🔍',
  async execute(sock, m, args){
    const jid = m.key.remoteJid
    const isGroup = jid.endsWith('@g.us')
    const sender = m.key.participant || m.participant || jid
    
    let targetJid = null
    const ctx = m.message?.extendedTextMessage?.contextInfo
    if(ctx?.participant) targetJid = ctx.participant
    else if(ctx?.mentionedJid?.[0]) targetJid = ctx.mentionedJid[0]
    else if(args[0]){
      let num = args[0].replace(/[^0-9]/g,'')
      if(num) targetJid = num + '@s.whatsapp.net'
    }
    if(!targetJid) targetJid = isGroup ? jid : sender

    let pp = null
    try{ pp = await sock.profilePictureUrl(targetJid, 'image') }catch{}
    let name = targetJid
    try{ name = await sock.getName(targetJid) }catch{}
    
    let status = "No status", date = "N/A", desc="", type="Personal WhatsApp"
    const isGroupInfo = targetJid.endsWith('@g.us')

    if(isGroupInfo){
      try{
        const meta = await sock.groupMetadata(targetJid)
        name = meta.subject
        desc = meta.desc || "No description"
        date = meta.creation ? new Date(meta.creation*1000).toLocaleString() : "Unknown"
        type = `Group • ${meta.participants.length} members`
        status = `Owner: ${meta.owner?.split('@')[0] || 'Unknown'}`
      }catch{}
    } else {
      try{
        const st = await sock.fetchStatus(targetJid)
        if(st?.status){ status = st.status; if(st.setAt) date = new Date(st.setAt).toLocaleString() }
      }catch{}
    }

    let cap = `*META-AI - WHATSAPP INFO*\n━━━━━━━━━━━━━━\n\n`
    if(isGroupInfo){
      cap+=`🖼️ *Group:* ${name}\n🆔 *ID:* ${targetJid}\n👥 *Type:* ${type}\n📅 *Created:* ${date}\n📝 *Desc:* ${desc.slice(0,400)}\n`
    } else {
      cap+=`👤 *Name:* ${name}\n🆔 *JID:* ${targetJid}\n📱 *Num:* @${targetJid.split('@')[0]}\n💼 *Type:* ${type}\n📝 *About:* ${status}\n📅 *Set:* ${date}\n`
    }
    cap+=`\n━━━━━━━━━━━━━━`

    if(pp) await sock.sendMessage(jid,{image:{url:pp},caption:cap,mentions:[targetJid]},{quoted:m})
    else await sock.sendMessage(jid,{text:cap,mentions:[targetJid]},{quoted:m})
  }
}
