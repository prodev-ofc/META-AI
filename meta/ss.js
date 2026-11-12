const fetch = require('node-fetch');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

module.exports={
  name:"ss",
  react:"📸",
  alias:["ssweb","screenshot","webss"],
  category:"tools",
  desc:"Screenshot website",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const url = args[0]?.trim()

    if(!url){
      return sock.sendMessage(jid,{
        text:`*📸 SCREENSHOT TOOL*\n\n*.ss <url>*\n*.ssweb <url>*\n*.screenshot <url>*\n\nExample:\n.ss https://google.com\n\n${WATERMARK}`
      },{quoted:m})
    }

    if(!url.startsWith('http://') && !url.startsWith('https://')){
      return sock.sendMessage(jid,{text:`❌ Provide valid URL with http:// or https://\n\n${WATERMARK}`},{quoted:m})
    }

    try{
      await sock.sendMessage(jid,{react:{text:"📸",key:m.key}})
      await sock.sendPresenceUpdate('composing', jid).catch(()=>{})

      const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`
      const res = await fetch(apiUrl, {headers:{'accept':'*/*'}})
      if(!res.ok) throw new Error(`API ${res.status}`)

      const buf = await res.buffer()

      await sock.sendMessage(jid,{
        image: buf,
        caption:`✅ Screenshot: ${url}\n\n${WATERMARK}`
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log('[ss] error:', e.message)
      await sock.sendMessage(jid,{
        text:`❌ Failed to take screenshot.\nReason: ${e.message}\n\nPossible:\n• Invalid URL\n• Site blocking\n• API down\n\n${WATERMARK}`
      },{quoted:m})
    }
  }
}
