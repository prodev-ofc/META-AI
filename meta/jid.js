module.exports={
  name:'jid',
  alias:['getjid','id'],
  category:'utility',
  react:'🆔',
  async execute(sock,m,args){
    const jid=m.key.remoteJid
    const sender=m.key.participant||m.participant||jid
    const ctx=m.message?.extendedTextMessage?.contextInfo
    let target=jid
    let label="This Chat"
    if(ctx?.participant){ target=ctx.participant; label="Quoted User" }
    else if(ctx?.mentionedJid?.[0]){ target=ctx.mentionedJid[0]; label="Mentioned" }
    else if(args[0]?.includes('@')){ target=args[0]; label="From args" }
    
    let cap=`*JID INFO*\n\n💬 Chat: ${jid}\n👤 You: ${sender}\n🎯 ${label}: ${target}\n\nRaw ID: ${target.split('@')[0]}`
    await sock.sendMessage(jid,{text:cap},{quoted:m})
    await sock.sendMessage(jid,{text:`\`\`\`${target}\`\`\``},{quoted:m})
  }
}
