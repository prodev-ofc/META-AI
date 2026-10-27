const fs=require('fs')
const path=require('path')
const dbPath=path.join(__dirname,'../data/warns.json')
function loadDB(){ try{ return JSON.parse(fs.readFileSync(dbPath)) }catch{ return {} } }
function saveDB(d){ try{ fs.writeFileSync(dbPath, JSON.stringify(d,null,2)) }catch{} }
function norm(jid){ return jid.split('@')[0] }

module.exports={
  name:"resetwarn", react:"♻️", category:"group", alias:["resetwarns","clearwarns","clearwarn"], desc:"Reset warns for user or all",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const ctx=m.message?.extendedTextMessage?.contextInfo
    let target=ctx?.participant || ctx?.mentionedJid?.[0]
    const db=loadDB()

    if(!target && args[0]?.toLowerCase()==='all'){
      db[jid]={}
      saveDB(db)
      return sock.sendMessage(jid,{text:"*♻️ All warns cleared for this group*"}, {quoted:m})
    }

    if(!target){
      const num=args[0]?.replace(/[^0-9]/g,'')
      if(num) target=num+'@s.whatsapp.net'
    }

    if(!target) return sock.sendMessage(jid,{text:"*♻️ RESETWARN*\n.resetwarn @user - clear user\n.resetwarn all - clear all"}, {quoted:m})

    if(db[jid]?.[target]){
      delete db[jid][target]
      saveDB(db)
      await sock.sendMessage(jid,{text:`*♻️ Reset*\n@${norm(target)} warns cleared to 0/3`, mentions:[target]}, {quoted:m})
    }else{
      await sock.sendMessage(jid,{text:`❌ No warns for @${norm(target)}`, mentions:[target]}, {quoted:m})
    }
  }
}
