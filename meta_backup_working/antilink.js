const fs=require('fs')
const path=require('path')
const dbPath=path.join(__dirname,'../data/antilink.json')
const WATERMARK="> _\u2728\uFE0FMETA AI by \uD835\uDD95\uD835\uDD97\uD835\uDD94\uD835\uDC1D\uD835\uDC1E\uD835\uDC2F \uD835\uDD94\uD835\uDD8B\uD835\uDD8B\uD835\uDD8E\uD835\uDD8C\uD835\uDD8E\uD835\uDD86\uD835\uDD91\uD835\uDD8C_"
function loadDB(){ try{ return JSON.parse(fs.readFileSync(dbPath)) }catch{ return {} } }
function saveDB(d){ try{ const dir=path.dirname(dbPath); if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(dbPath, JSON.stringify(d,null,2)) }catch{} }
function norm(jid){ if(!jid) return ""; return jid.split('@')[0].split(':')[0] }
function isLink(text){
  if(!text) return false
  const t=text.toLowerCase()
  if(t.includes('whatsapp.com/channel')) return true
  return /(https?:\/\/|www\.\S+|chat\.whatsapp\.com\/\S+|wa\.me\/\S+|t\.me\/\S+|discord\.gg\/\S+)/i.test(text)
}
async function isAdmin(sock, jid, m){
  try{
    const meta=await sock.groupMetadata(jid)
    const sender1=m.key.participant || m.participant || ""
    const sender2=m.key.participantAlt || m.participantAlt || ""
    const s1=norm(sender1)
    const s2=norm(sender2)
    for(const p of meta.participants){
      if(!p.admin) continue
      const pNorm=norm(p.id)
      const pJidNorm=p.jid ? norm(p.jid) : ""
      const pPhoneNorm=p.phoneNumber ? norm(p.phoneNumber) : ""
      if(pNorm===s1 || pNorm===s2 || pJidNorm===s1 || pJidNorm===s2 || pPhoneNorm===s1 || pPhoneNorm===s2 || p.id===sender1 || p.id===sender2){
        return true
      }
    }
    return false
  }catch{ return false }
}
module.exports={
  name:"antilink",
  react:"\uD83D\uDD17",
  alias:["antilinks"],
  category:"group",
  desc:"Antilink - admins exempt",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`\u274C Group only\n\n${WATERMARK}`},{quoted:m})
    if(!await isAdmin(sock, jid, m)) return sock.sendMessage(jid,{text:`\u274C Only admins\n\n${WATERMARK}`},{quoted:m})
    const action=(args[0]||'').toLowerCase()
    if(!['on','off','warn','kick','status'].includes(action)){
      return sock.sendMessage(jid,{text:`*\uD83D\uDD17 ANTILINK*\n.on\n.warn\n.kick\n.off\n.status\n\nAdmins exempt\n\n${WATERMARK}`},{quoted:m})
    }
    let db=loadDB()
    if(!db[jid]) db[jid]={ enabled:false, mode:'delete', warns:{} }
    if(action==='off'){ db[jid].enabled=false; saveDB(db); return sock.sendMessage(jid,{text:`*\uD83D\uDD17 OFF*\n\n${WATERMARK}`},{quoted:m}) }
    if(action==='status'){ return sock.sendMessage(jid,{text:`*\uD83D\uDD17 Status*\nMode: ${db[jid].mode}\nEnabled: ${db[jid].enabled}\n\n${WATERMARK}`},{quoted:m}) }
    db[jid].enabled=true
    if(action==='on') db[jid].mode='delete'
    if(action==='warn') db[jid].mode='warn'
    if(action==='kick') db[jid].mode='kick'
    saveDB(db)
    await sock.sendMessage(jid,{text:`*\uD83D\uDD17 ${action.toUpperCase()} enabled*\nAdmins exempt \u2705\n\n${WATERMARK}`},{quoted:m})
  },
  handleAntilink: async (sock, m)=>{
    try{
      const jid=m.key.remoteJid
      if(!jid.endsWith('@g.us')) return
      if(m.key.fromMe) return
      const db=loadDB()
      const conf=db[jid]
      if(!conf?.enabled) return
      const text=m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || ""
      if(!isLink(text)) return
      if(await isAdmin(sock, jid, m)) return
      const sender=m.key.participant || m.participant || jid
      try{ await sock.sendMessage(jid,{delete:m.key}) }catch{}
      if(conf.mode==='warn'){
        if(!conf.warns) conf.warns={}
        conf.warns[sender]=(conf.warns[sender]||0)+1
        saveDB(db)
        if(conf.warns[sender]>=3){
          try{ await sock.groupParticipantsUpdate(jid,[sender],'remove') }catch{}
          delete conf.warns[sender]; saveDB(db)
        }else{
          await sock.sendMessage(jid,{text:`*\u26A0\uFE0F Warning ${conf.warns[sender]}/3* @${norm(sender)} no links!`, mentions:[sender]})
        }
      }else if(conf.mode==='kick'){
        try{ await sock.groupParticipantsUpdate(jid,[sender],'remove') }catch{}
      }
    }catch{}
  }
}
