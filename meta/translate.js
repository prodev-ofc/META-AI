const fs=require('fs'),path=require('path')
function getGroqKey(){
  try{
    const env=fs.readFileSync(path.join(process.cwd(),'.env'),'utf8')
    const m=env.match(/GROQ_API_KEY\s*=\s*(gsk_[^\s\n]+)/)
    if(m) return m[1].trim()
  }catch{}
  return process.env.GROQ_API_KEY
}

module.exports={
  name:"translate", react:"🌍", category:"ai", alias:["trt","tr"], desc:"Translate text",
  execute: async (sock,m,args)=>{
    if(!args[0]) return await sock.sendMessage(m.key.remoteJid,{text:"*Translate* 🌍\n\nUse:\n.trt en Ndiyani akunetsa (to English)\n.trt sn who is troubling you (to Shona)\n.trt shona hello\nLanguages: sn/shona, en, ndebele, zulu, fr, pt, sw"}, {quoted:m})
    
    let target=args[0].toLowerCase()
    let text=args.slice(1).join(' ')
    
    // Auto detect if no lang code
    if(text.length<1){ text=target; target="en" }
    
    const langMap={sn:"Shona", shona:"Shona", en:"English", english:"English", nd:"Ndebele", ndebele:"Ndebele", zu:"Zulu", zulu:"Zulu", fr:"French", pt:"Portuguese", sw:"Swahili"}
    const targetLang=langMap[target]||target
    
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🌍",key:m.key}})
    try{
      const key=getGroqKey()
      const sys=`You are a translator. Translate user text to ${targetLang}. Only return translation, no explanation. Keep slang if Shona.`
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
        body:JSON.stringify({model:"llama-3.1-8b-instant", messages:[{role:"system",content:sys},{role:"user",content:text}], temperature:0.3, max_tokens:400})
      })
      const d=await r.json()
      const translated=d.choices?.[0]?.message?.content || "Failed"
      await sock.sendMessage(m.key.remoteJid,{text:`*${targetLang}* 🌍\n\n${translated}\n\n> _✨️Meta AI_ `},{quoted:m})
    }catch(e){
      await sock.sendMessage(m.key.remoteJid,{text:"Translate error: "+e.message},{quoted:m})
    }
  }
}
