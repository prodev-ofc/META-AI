const fs=require('fs'), path=require('path')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
const DB_PATH=path.join(__dirname,'..','database','welcome.json')
module.exports={
 name:"goodbye", alias:["bye","left"], category:"group",
 async execute(sock,m,args){
  const welcome=require('./welcome.js'); if(welcome.init) welcome.init(sock)
  const db=JSON.parse(fs.readFileSync(DB_PATH)); const cmd=(args[0]||'').toLowerCase()
  const jid=m.key.remoteJid
  if(!cmd) return sock.sendMessage(jid,{text:`*╭┈───〔 👋 GOODBYE 〕┈───⊷*\n*├• Status:* ${db.enabled?'ON ✅':'OFF ❌'}\n*├• .goodbye on / off\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
  if(cmd==='on'){ db.enabled=true; fs.writeFileSync(DB_PATH, JSON.stringify(db)); return sock.sendMessage(jid,{text:`*╭┈───〔 👋 GOODBYE 〕┈───⊷*\n*├• ✅ Enabled\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m}) }
  if(cmd==='off'){ db.enabled=false; fs.writeFileSync(DB_PATH, JSON.stringify(db)); return sock.sendMessage(jid,{text:`*╭┈───〔 👋 GOODBYE 〕┈───⊷*\n*├• ❌ Disabled\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m}) }
 }
}
