const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"
const TEMP_DIR = path.join(__dirname, '..', 'temp')
if(!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, {recursive:true})

function generateTTS(text, lang, filePath){
  return new Promise((resolve, reject)=>{
    const gtts = new gTTS(text, lang)
    gtts.save(filePath, (err)=>{
      if(err) return reject(err)
      resolve(filePath)
    })
  })
}

module.exports={
  name:"tts",
  react:"🔊",
  alias:["say","gtts","speak"],
  category:"tools",
  desc:"Text to speech",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    
    let language = 'en'
    let text = args.join(" ").trim()

    // Support: .tts en Hello or .tts Hello
    if(args.length >= 2 && /^[a-z]{2}$/i.test(args[0])){
      language = args[0].toLowerCase()
      text = args.slice(1).join(" ").trim()
    }

    if(!text){
      return sock.sendMessage(jid,{
        text:`*TTS Usage:*\n.tts <text>\n.tts <lang> <text>\n\nExamples:\n.tts Hello world\n.tts en Hello\n.tts fr Bonjour\n.tts ja Konnichiwa\n\nLangs: en, fr, es, de, ja, hi, etc\n\n${WATERMARK}`
      },{quoted:m})
    }

    const fileName = `tts-${Date.now()}.mp3`
    const filePath = path.join(TEMP_DIR, fileName)

    try{
      await sock.sendMessage(jid,{react:{text:"🔊",key:m.key}})

      await generateTTS(text, language, filePath)

      await sock.sendMessage(jid,{
        audio: { url: filePath },
        mimetype: 'audio/mpeg',
        ptt: false
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

      try{ fs.unlinkSync(filePath) }catch{}

    }catch(e){
      console.log('[tts] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Error generating TTS: ${e.message}\n\n${WATERMARK}`},{quoted:m})
      try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath) }catch{}
    }
  }
}
