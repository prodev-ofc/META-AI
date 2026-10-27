const fs=require('fs'),path=require('path')
const DB_PATH=path.resolve(process.cwd(),'data/chatbot.json')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
const cooldown=new Map()
function loadDB(){try{if(!fs.existsSync(DB_PATH))fs.writeFileSync(DB_PATH,'{}');return JSON.parse(fs.readFileSync(DB_PATH))}catch{return{}}}
function saveDB(d){fs.writeFileSync(DB_PATH,JSON.stringify(d,null,2))}
function getText(mm){return mm?.body||mm?.text||mm?.message?.conversation||mm?.message?.extendedTextMessage?.text||""}
function getBotIds(sock){return [sock.user?.id?.split(':')[0],sock.user?.lid?.split(':')[0]].filter(Boolean)}
async function askPollinations(prompt){
  try{ const res=await fetch(`https://text.pollinations.ai/${encodeURIComponent(`You are META-AI, cool savage funny WhatsApp AI made by prodev. Keep replies short (1-2 lines), Gen Z slang. User: ${prompt}`)}`); const text=await res.text(); if(text && text.length>3 && text.length<400) return text }catch{} return null
}
async function askDavid(prompt){
  try{ const r=await fetch(`https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(prompt)}`,{signal:AbortSignal.timeout(8000)}); const d=await r.json(); let txt=d.result||d.response||d.message||""; if(txt && txt.length>3) return txt }catch{} return null
}
async function getAI(p){
  let r=await askDavid(p); if(r){return `${r}\n\n${WATERMARK}`}
  r=await askPollinations(p); if(r){return `${r}\n\n${WATERMARK}`}
  return `No cap, I got you ✨ ${p.slice(0,80)}\n\n${WATERMARK}`
}
module.exports={
  name:"chatbot", react:"🧠", category:"ai", alias:["ai","chat"], desc:"AI chatbot toggle",
  execute: async (sock,m,args,{WATERMARK})=>{
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🧠",key:m.key}});
    const chatId=m.key.remoteJid; const db=loadDB(); const act=(args[0]||"").toLowerCase()
    if(!act||act==="status"){return await sock.sendMessage(chatId,{text:`*CHATBOT MENU* 🧠\n\nStatus: ${db[chatId]?.enabled?"✅ ON":"❌ OFF"}\n\n*.chatbot on* / *off*\n\n${WATERMARK}`},{quoted:m})}
    if(act==="on"){db[chatId]={enabled:true};saveDB(db);return await sock.sendMessage(chatId,{text:`✅ Chatbot ON\n\nMention "meta ai" or reply to me\n\n${WATERMARK}`},{quoted:m})}
    if(act==="off"){db[chatId]={enabled:false};saveDB(db);return await sock.sendMessage(chatId,{text:`❌ Chatbot OFF\n\n${WATERMARK}`},{quoted:m})}
  },
  async handleChatbot(sock,mm,mek){
    try{
      const m=mm||mek; const chatId=m.key?.remoteJid; const body=getText(m)||getText(mek)
      if(!chatId||!body) return false
      if(m.key?.fromMe) return false
      if(body.includes(WATERMARK)) return false
      if(body.includes("PONG!")) return false
      const db=loadDB(); if(!db[chatId]?.enabled) return false
      const lower=body.toLowerCase(); if(lower.startsWith('.')||lower.startsWith('!'))return false
      const now=Date.now(); if(cooldown.has(chatId) && now-cooldown.get(chatId)<3000) return false; cooldown.set(chatId, now)
      const quotedId=m.message?.extendedTextMessage?.contextInfo?.participant||""; const botIds=getBotIds(sock)
      const isReplyToBot=botIds.some(id=>quotedId&&quotedId.includes(id)); const contains=lower.includes("meta ai")||lower.includes("meta-ai")
      if(!contains&&!isReplyToBot) return false
      console.log(`[CHATBOT] ${body}`); try{await sock.sendPresenceUpdate('composing',chatId)}catch{}; try{await sock.sendMessage(chatId,{react:{text:"👁️",key:m.key}})}catch{}
      let prompt=body.replace(/meta ai|meta-ai/gi,'').trim()||body; const reply=await getAI(prompt)
      await sock.sendMessage(chatId,{text:reply},{quoted:m}); return true
    }catch(e){console.log("[CHATBOT ERR]",e.message);return false}
  }
}
