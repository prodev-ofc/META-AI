const axios = require('axios')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const path = require('path')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
async function downloadMedia(quoted, type) {
  let stream = await downloadContentFromMessage(quoted[type], type.split('Message')[0])
  let buffer = Buffer.from([])
  for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
  return buffer
}
module.exports = {
  name: "getcode",
  react: "📦",
  category:"tools",
  alias:["getc","code","tcode","tocode"],
  desc:"Convert media/text/link to document",
  execute: async (sock, m, args) => {
    try{ await sock.sendMessage(m.key.remoteJid,{react:{text:"⏳",key:m.key}})}catch{}
    try{
      const ctx = m.message?.extendedTextMessage?.contextInfo
      const q = ctx?.quotedMessage || null
      let buffer = null; let filename = `code_${Date.now()}`; let mime = "application/octet-stream"
      if (q) {
        let type = Object.keys(q)[0]
        if(type==='conversation' || type==='extendedTextMessage'){
          let t = q.conversation || q.extendedTextMessage?.text || ""
          buffer = Buffer.from(t); filename = `code_${Date.now()}.js`; mime = "application/javascript"
        } else {
          try{
            if(q.imageMessage){ buffer = await downloadMedia(q, 'imageMessage'); filename = `image_${Date.now()}.jpg`; mime = q.imageMessage.mimetype }
            else if(q.videoMessage){ buffer = await downloadMedia(q, 'videoMessage'); filename = `video_${Date.now()}.mp4`; mime = q.videoMessage.mimetype }
            else if(q.audioMessage){ buffer = await downloadMedia(q, 'audioMessage'); filename = `audio_${Date.now()}.mp3`; mime = q.audioMessage.mimetype }
            else if(q.documentMessage){ buffer = await downloadMedia(q, 'documentMessage'); filename = q.documentMessage.fileName || filename; mime = q.documentMessage.mimetype }
            else if(q.stickerMessage){ buffer = await downloadMedia(q, 'stickerMessage'); filename = `sticker_${Date.now()}.webp`; mime = 'image/webp' }
          }catch(e){}
        }
      }
      if(!buffer && args[0]){
        let url = args[0]; if(!url.startsWith('http')) url = 'https://'+url
        if(url.includes('github.com') && url.includes('/blob/')) url = url.replace('github.com','raw.githubusercontent.com').replace('/blob/','/')
        const res = await axios.get(url,{responseType:'arraybuffer',timeout:60000})
        buffer = Buffer.from(res.data); filename = path.basename(new URL(url).pathname) || filename
      }
      if(!buffer){
        let ownType = Object.keys(m.message || {})[0]
        try{ if(ownType && m.message[ownType]?.mimetype){ buffer = await downloadMedia(m.message, ownType); filename = `media_${Date.now()}.jpg` } }catch{}
      }
      if(!buffer){
        return sock.sendMessage(m.key.remoteJid,{text:`*📦 GETCODE*\n\nReply to file/photo/video/doc with .getcode\nOr .getcode <link>\n\n${WATERMARK}`},{quoted:m})
      }
      await sock.sendMessage(m.key.remoteJid,{react:{text:"📦",key:m.key}})
      await sock.sendMessage(m.key.remoteJid,{document: buffer, mimetype: mime, fileName: filename, caption: `*📦 CONVERTED*\n*File:* ${filename}\n\n${WATERMARK}`},{quoted: m})
    }catch(e){ await sock.sendMessage(m.key.remoteJid,{text:`❌ ${e.message}\n\n${WATERMARK}`},{quoted: m}) }
  }
}
