const fs=require('fs')
const path=require('path')
const dbPath=path.join(__dirname,'../data/warns.json')
const WATERMARK="> _✨️Meta AI by prodev_"
function loadDB(){ try{ return JSON.parse(fs.readFileSync(dbPath)) }catch{ return {} } }
function saveDB(d){ try{ fs.writeFileSync(dbPath, JSON.stringify(d,null,2)) }catch{} }
function norm(jid){ return jid.split('@')[0].split(':')[0] }
function getTarget(m, args){
  const ctx=m.message?.extendedTextMessage?.contextInfo
  if(ctx?.participant) return ctx.participant
  if(ctx?.mentionedJid?.length) return ctx.mentionedJid[0]
  const num=args[0]?.replace(/[^0-9]/g,'')
  if(num && num.length>=8) return num+'@s.whatsapp.net'
  return null
}
async function isAdmin(sock, jid, senderId){
  try{
    const meta=await sock.groupMetadata(jid)
    const sNorm=norm(senderId)
    for(const p of meta.participants){ if(norm(p.id)===sNorm || p.id===senderId){ if(p.admin) return true } }
    return false
  }catch{ return false }
}

module.exports={
  name:"dewarn", react:"♻️", category:"group", alias:["delwarn","removewarn","unwarn","resetwarn"], desc:"Remove 1 warn or reset all warns for user",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`❌ Group only\n\n${WATERMARK}`},{quoted:m})
    const sender=m.key.participant || m.key.remoteJid
    if(!await isAdmin(sock, jid, sender)) return sock.sendMessage(jid,{text:`❌ Admin only\n\n${WATERMARK}`},{quoted:m})

    const target=getTarget(m, args)
    if(!target) return sock.sendMessage(jid,{text:`*♻️ DEWARN*\n\nReply or mention user:\n.dewarn @user - remove 1 warn\n.resetwarn @user - clear all\n.resetwarn all - clear all group warns`},{quoted:m})

    let db=loadDB()
    const isAllReset=args[0]?.toLowerCase()==='all' || target.toLowerCase?.()==='all'

    if(isAllReset || args.includes('all')){
      if(args[0]==='all'){
        db[jid]={}
        saveDB(db)
        await sock.sendMessage(jid,{react:{text:"♻️",key:m.key}})
        return sock.sendMessage(jid,{text:`*♻️ ALL WARNS RESET*\nCleared all warns in this group\n\n${WATERMARK}`},{quoted:m})
      }
    }

    if(!db[jid] || !db[jid][target]){
      return sock.sendMessage(jid,{text:`❌ @${norm(target)} has no warns`, mentions:[target]},{quoted:m})
    }

    // .resetwarn @user -> clear all for that user
    if(args.includes('reset') || m.message?.conversation?.includes('resetwarn') || args[0]?.toLowerCase()==='resetwarn' || args.length===0 || (args[0] && args[0].toLowerCase()!=='1' && norm(args[0])===norm(target))){
      // if command is resetwarn, delete all
      const cmd=m.message?.extendedTextMessage?.text || m.message?.conversation || ""
      if(cmd.toLowerCase().includes('resetwarn')){
        delete db[jid][target]
        saveDB(db)
        await sock.sendMessage(jid,{react:{text:"♻️",key:m.key}})
        return sock.sendMessage(jid,{text:`*♻️ RESET WARN*\n\n*User:* @${norm(target)}\nAll warns cleared (0/3)\n\n${WATERMARK}`, mentions:[target]},{quoted:m})
      }
    }

    // default dewarn = -1
    db[jid][target].count=Math.max(0, db[jid][target].count-1)
    db[jid][target].reasons.pop()
    if(db[jid][target].count===0) delete db[jid][target]
    saveDB(db)

    await sock.sendMessage(jid,{react:{text:"♻️",key:m.key}})
    const newCount=db[jid][target]?.count||0
    await sock.sendMessage(jid,{text:`*♻️ DEWARNED*\n\n*User:* @${norm(target)}\n*New:* ${newCount}/3 warns\n\n${WATERMARK}`, mentions:[target]},{quoted:m})
  }
}
