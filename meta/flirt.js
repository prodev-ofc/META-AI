const { api } = require('../lib/api')
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

module.exports={
  name:"flirt",
  react:"😍",
  alias:["pickup","rizz","flirtline"],
  category:"fun",
  desc:"Random flirt line from Shizo API",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    try{
      await sock.sendMessage(jid,{react:{text:"😍",key:m.key}})

      // Using lib/api.js instead of node-fetch
      const { data } = await api.get('https://shizoapi.onrender.com/api/texts/flirt',{
        params:{ apikey:'shizo' },
        timeout:15000
      })

      const flirtMessage = data?.result || data?.msg || data?.message
      if(!flirtMessage) throw new Error('No flirt text')

      await sock.sendMessage(jid,{
        text:`*😍 FLIRT:*\n\n${flirtMessage}\n\n${WATERMARK}`
      },{quoted:m})

    }catch(e){
      console.log('[flirt] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Failed to get flirt line\n${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
