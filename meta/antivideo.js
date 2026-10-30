// antivideo.js - META-AI compatible
const fs=require('fs'), path=require('path')
const DB=path.join(__dirname,'../database/antivideo.json')
function load(){ try{ if(!fs.existsSync(DB)) fs.writeFileSync(DB,'{}'); return JSON.parse(fs.readFileSync(DB)) }catch{ return {} } }
function save(d){ fs.writeFileSync(DB,JSON.stringify(d,null,2)) }
module.exports={
  name:'antivideo',
  alias:['novid'],
  category:'group',
  react:'🎬',
  async execute(sock,m,args){
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:'Group only'},{quoted:m})
    const db=load()
    const a=(args[0]||'status').toLowerCase()
    if(a==='status') return sock.sendMessage(jid,{text:`AntiVideo: ${db[jid]?.enabled?'ON ✅':'OFF ❌'}`},{quoted:m})
    if(a==='on'){ db[jid]={enabled:true}; save(db); return sock.sendMessage(jid,{text:'✅ AntiVideo ON'},{quoted:m}) }
    if(a==='off'){ db[jid]={enabled:false}; save(db); return sock.sendMessage(jid,{text:'❌ OFF'},{quoted:m}) }
  }
}
