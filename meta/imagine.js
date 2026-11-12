const { api } = require('../lib/api')
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

function enhancePrompt(prompt) {
  const qualityEnhancers = [
    'high quality',
    'detailed',
    'masterpiece',
    'best quality',
    'ultra realistic',
    '4k',
    'highly detailed',
    'professional photography',
    'cinematic lighting',
    'sharp focus'
  ]
  const num = Math.floor(Math.random() * 2) + 3
  const selected = qualityEnhancers.sort(()=>Math.random()-0.5).slice(0,num)
  return `${prompt}, ${selected.join(', ')}`
}

module.exports={
  name:"imagine",
  react:"🎨",
  alias:["aiimg","genimg","dalle"],
  category:"ai",
  desc:"Generate image from text",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const rawPrompt = args.join(" ").trim()

    if(!rawPrompt){
      return sock.sendMessage(jid,{
        text:`*🎨 IMAGINE*\n\nUsage: .imagine a beautiful sunset over mountains\n\nExample:\n.imagine anime girl with wings\n.imagine cyberpunk city night\n\n${WATERMARK}`
      },{quoted:m})
    }

    try{
      await sock.sendMessage(jid,{react:{text:"🎨",key:m.key}})
      await sock.sendMessage(jid,{
        text:`🎨 Generating image for: *${rawPrompt}*...\nPlease wait ⏳\n\n${WATERMARK}`
      },{quoted:m})

      const enhancedPrompt = enhancePrompt(rawPrompt)

      // Using lib/api.js - arraybuffer like your old code
      const { data } = await api.get('https://shizoapi.onrender.com/api/ai/imagine',{
        params:{ apikey:'shizo', query: enhancedPrompt },
        responseType:'arraybuffer',
        timeout:60000
      })

      const imageBuffer = Buffer.from(data)

      await sock.sendMessage(jid,{
        image: imageBuffer,
        caption:`*🎨 Generated:*\n"${rawPrompt}"\n\n${WATERMARK}`
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log('[imagine] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Failed to generate image: ${e.message}\n\n${WATERMARK}`},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"❌",key:m.key}})
    }
  }
}
