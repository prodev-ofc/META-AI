const fs=require('fs')
const path=require('path')
const dbPath=path.join(__dirname,'../data/warns.json')
function loadDB(){ try{ return JSON.parse(fs.readFileSync(dbPath)) }catch{ return {} } }
function norm(jid){ return jid.split('@')[0] }

module.exports={
  name:"warns", react:"📋", category:"group", alias:["warnlist","warningslist"], desc:"List all warned users in group",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:"❌ Group only"},{quoted:m})
    const db=loadDB()
    const groupWarns=db[jid]
    if(!groupWarns || Object.keys(groupWarns).length===0){
      return sock.sendMessage(jid,{text:"*📋 WARNS*\n\nNo warns in this group"}, {quoted:m})
    }
    let text=`*📋 WARN LIST - ${Object.keys(groupWarns).length} users*\n\n`
    for(const [user, data] of Object.entries(groupWarns)){
      text+=`@${norm(user)} : ${data.count}/3\n - Last: ${data.reasons.slice(-1)[0]?.reason}\n`
    }
    await sock.sendMessage(jid,{text, mentions: Object.keys(groupWarns)},{quoted:m})
  }
}
