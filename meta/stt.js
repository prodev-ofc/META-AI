const fs=require('fs'),path=require('path')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
function getGroqKey(){
  try{
    const env=fs.readFileSync(path.join(process.cwd(),'.env'),'utf8')
    const m=env.match(/GROQ_API_KEY\s*=\s*(gsk_[^\s\n]+)/)
    if(m) return m[1].trim()
  }catch{}
  return process.env.GROQ_API_KEY
}

module.exports={
  name:"stt", react:"🎤", category:"ai", alias:["transcribe","totext"], desc:"Voice to text (Groq Whisper)",
  execute: async (sock,m,args)=>{
    const quoted=m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const msg = quoted ? {message:quoted, key:{remoteJid:m.key.remoteJid}} : m
    const isAudio = msg.message?.audioMessage || msg.message?.pttMessage || m.message?.audioMessage || m.message?.pttMessage
    if(!isAudio) return await sock.sendMessage(m.key.remoteJid,{text:"*STT* 🎤\n\nReply to a voice note with .stt\nOr send voice + caption .stt"}, {quoted:m})
    
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🎤",key:m.key}})
    try{
      const buffer=await downloadMediaMessage(msg, 'buffer', {}, {logger:console, reuploadRequest:sock.updateMediaMessage})
      const FormData=require('form-data')
      const tmpDir=path.join(process.cwd(),'tmp')
      if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir,{recursive:true})
      const tmpFile=path.join(tmpDir, `${Date.now()}.ogg`)
      fs.writeFileSync(tmpFile, buffer)
      
      const key=getGroqKey()
      const form=new FormData()
      form.append('file', fs.createReadStream(tmpFile))
      form.append('model','whisper-large-v3')
      
      const res=await fetch("https://api.groq.com/openai/v1/audio/transcriptions",{
        method:"POST",
        headers:{Authorization:`Bearer ${key}`, ...form.getHeaders()},
        body:form
      })
      const d=await res.json()
      try{ fs.unlinkSync(tmpFile) }catch{}
      
      if(d.text){
        await sock.sendMessage(m.key.remoteJid,{text:`*Transcription* 🎤\n\n${d.text}\n\n> _✨️Meta AI_ `},{quoted:m})
      }else{
        await sock.sendMessage(m.key.remoteJid,{text:`Failed: ${JSON.stringify(d).slice(0,200)}`},{quoted:m})
      }
    }catch(e){
      await sock.sendMessage(m.key.remoteJid,{text:"STT error: "+e.message},{quoted:m})
    }
  }
}
