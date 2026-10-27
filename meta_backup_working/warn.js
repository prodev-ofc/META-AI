const fs=require('fs')
const path=require('path')
const dbPath=path.join(__dirname,'../data/warns.json')
const WATERMARK="> _✨️Meta AI by prodev_"

function loadDB(){ try{ return JSON.parse(fs.readFileSync(dbPath)) }catch{ return {} } }
function saveDB(d){ try{ const dir=path.dirname(dbPath); if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(dbPath, JSON.stringify(d,null,2)) }catch{} }
function norm(jid){ return jid.split('@')[0].split(':')[0] }
function getTarget(m, args){
  // 1. reply
  const ctx=m.message?.extendedTextMessage?.contextInfo
  if(ctx?.participant) return ctx.participant
  // 2. mention
  if(ctx?.mentionedJid?.length) return ctx.mentionedJid[0]
  // 3. number in args
  const num=args[0]?.replace(/[^0-9]/g,'')
  if(num && num.length>=8) return num+'@s.whatsapp.net'
  return null
}
async function isAdmin(sock, jid, senderId){
  try{
    const meta=await sock.groupMetadata(jid)
    const sNorm=norm(senderId)
    for(const p of meta.participants){
      if(norm(p.id)===sNorm || p.id===senderId){
        if(p.admin) return true
      }
    }
    return false
  }catch{ return false }
}

module.exports={
  name:"warn", react:"⚠️", category:"group", alias:["warnings","addwarn"], desc:"Warn user (reply or mention), 3 warns = kick",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`❌ Group only\n\n${WATERMARK}`},{quoted:m})
    const sender=m.key.participant || m.key.remoteJid
    if(!await isAdmin(sock, jid, sender)) return sock.sendMessage(jid,{text:`❌ Admin only\n\n${WATERMARK}`},{quoted:m})

    const target=getTarget(m, args)
    if(!target) return sock.sendMessage(jid,{text:`*⚠️ WARN*\n\nReply to user or mention:\n.warn @user reason\n.warn (reply)\n\nSee warns: .warns`},{quoted:m})

    if(await isAdmin(sock, jid, target)) return sock.sendMessage(jid,{text:`❌ Can't warn admin\n\n${WATERMARK}`},{quoted:m})

    const reason=args.filter(a=>!a.includes('@')).join(' ').replace(/^[0-9]+/,'').trim() || "No reason"
    
    let db=loadDB()
    if(!db[jid]) db[jid]={}
    if(!db[jid][target]) db[jid][target]={ count:0, reasons:[] }
    
    db[jid][target].count+=1
    db[jid][target].reasons.push({ reason, date: new Date().toISOString(), by: sender })
    saveDB(db)

    const count=db[jid][target].count
    await sock.sendMessage(jid,{react:{text:"⚠️",key:m.key}})

    if(count>=3){
      await sock.sendMessage(jid,{text:`*⚠️ WARNING ${count}/3*\n\n*User:* @${norm(target)}\n*Reason:* ${reason}\n*Action:* Kicking - reached 3 warns\n\n${WATERMARK}`, mentions:[target]},{quoted:m})
      try{ await sock.groupParticipantsUpdate(jid,[target],'remove') }catch(e){ console.log(e) }
      delete db[jid][target]
      saveDB(db)
    }else{
      await sock.sendMessage(jid,{text:`*⚠️ WARNING ${count}/3*\n\n*User:* @${norm(target)}\n*Reason:* ${reason}\n*Remaining:* ${3-count} warns left\n\n${WATERMARK}`, mentions:[target, sender]},{quoted:m})
    }
  }
}
