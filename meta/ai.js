const fs=require('fs'),path=require('path')
function getGroqKey(){
  try{
    const env=fs.readFileSync(path.join(process.cwd(),'.env'),'utf8')
    const m=env.match(/GROQ_API_KEY\s*=\s*(gsk_[^\s\n]+)/)
    if(m) return m[1].trim()
  }catch{}
  return process.env.GROQ_API_KEY
}
function isShona(t){ return /(ndiyani|ndiri|arikunetsa|ndyn|boe|mannexy|ndaka|naye|wakadii|saka|ko|zvaita|sei)/i.test(t) }

module.exports={
  name:"ai", react:"🤖", category:"ai", alias:["gpt","llama"], desc:"Ask AI (multilingual)",
  execute: async (sock,m,args)=>{
    const prompt=args.join(' ')
    if(!prompt) return await sock.sendMessage(m.key.remoteJid,{text:"*AI* 🤖\n\nUse: .ai <question>\nEx: .ai Ndiyani akunetsa\n.ai who is Messi"},{quoted:m})
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🧠",key:m.key}})
    try{ await sock.sendPresenceUpdate('composing',m.key.remoteJid) }catch{}
    const key=getGroqKey()
    const sys = isShona(prompt) ? "You are META-AI by prodev. Reply in Shona slang, short, funny, 1-2 lines." : "You are META-AI by prodev. Reply in same language as user, cool, short, 1-2 lines."
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
        body:JSON.stringify({model:"llama-3.1-8b-instant", messages:[{role:"system",content:sys},{role:"user",content:prompt}], temperature:0.9, max_tokens:400})
      })
      const d=await r.json()
      const txt=d.choices?.[0]?.message?.content || "Ndakundikana boe 😅 edza futi"
      await sock.sendMessage(m.key.remoteJid,{text:txt+"\n\n> _✨️Meta AI_ "},{quoted:m})
    }catch(e){
      await sock.sendMessage(m.key.remoteJid,{text:"AI down rn 😅 try again\n> _✨️Meta AI_ "},{quoted:m})
    }
  }
}
