const fetch = require('node-fetch');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

async function doTranslate(text, lang){
  let translated=null

  // 1) Google gtX
  try{
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`)
    if(res.ok){
      const data = await res.json()
      if(data?.[0]?.[0]?.[0]) translated = data[0][0][0]
    }
  }catch{}

  // 2) MyMemory fallback
  if(!translated){
    try{
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`)
      if(res.ok){
        const data = await res.json()
        if(data?.responseData?.translatedText) translated = data.responseData.translatedText
      }
    }catch{}
  }

  // 3) Dreaded fallback
  if(!translated){
    try{
      const res = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(text)}&lang=${lang}`)
      if(res.ok){
        const data = await res.json()
        if(data?.translated) translated = data.translated
      }
    }catch{}
  }

  if(!translated) throw new Error('All translation APIs failed')
  return translated
}

module.exports={
  name:"translate",
  react:"🌐",
  alias:["trt","tr","trad"],
  category:"tools",
  desc:"Translate text",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid

    try{
      await sock.sendPresenceUpdate('composing', jid).catch(()=>{})

      let textToTranslate = ''
      let lang = ''

      const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      if(quotedMessage){
        textToTranslate = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || quotedMessage.imageMessage?.caption || quotedMessage.videoMessage?.caption || ''
        lang = args[0]?.trim() || 'en'
      } else {
        // .translate hello fr  OR  .translate fr
        if(args.length < 1){
          return sock.sendMessage(jid,{
            text:`*🌐 TRANSLATOR*\n\nUsage:\n1. Reply with: .trt <lang>\n2. Direct: .trt <text> <lang>\n\nEx:\n.trt hello fr\n.trt bonjour en\nReply to msg: .trt es\n\nLangs: fr, es, de, it, pt, ru, ja, ko, zh, ar, hi, en\n\n${WATERMARK}`
          },{quoted:m})
        }
        if(args.length === 1){
          // .trt fr  but no quoted? invalid
          if(/^[a-z]{2,3}$/i.test(args[0])){
            return sock.sendMessage(jid,{text:`❌ Reply to a message or provide text.\nEx: .trt hello fr\n\n${WATERMARK}`},{quoted:m})
          }
          // assume lang = en, text = args[0]
          lang = 'en'
          textToTranslate = args.join(' ')
        } else {
          lang = args.pop().toLowerCase()
          textToTranslate = args.join(' ')
        }
      }

      if(!textToTranslate){
        return sock.sendMessage(jid,{text:`❌ No text found to translate.\n\n${WATERMARK}`},{quoted:m})
      }

      if(!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang)){
        // if lang not valid, assume last word was part of text
        textToTranslate = `${textToTranslate} ${lang}`.trim()
        lang = 'en'
      }

      const translated = await doTranslate(textToTranslate, lang)

      await sock.sendMessage(jid,{
        text:`*🌐 Translated [${lang.toUpperCase()}]:*\n\n${translated}\n\n${WATERMARK}`
      },{quoted:m})

    }catch(e){
      console.log('[translate] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Failed to translate: ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
