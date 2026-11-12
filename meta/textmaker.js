const mumaker = require('mumaker');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

const EFFECTS = {
  metallic: "https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html",
  ice: "https://en.ephoto360.com/ice-text-effect-online-101.html",
  snow: "https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html",
  impressive: "https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html",
  matrix: "https://en.ephoto360.com/matrix-text-effect-154.html",
  light: "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html",
  neon: "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html",
  devil: "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html",
  purple: "https://en.ephoto360.com/purple-text-effect-online-100.html",
  thunder: "https://en.ephoto360.com/thunder-text-effect-online-97.html",
  leaves: "https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html",
  '1917': "https://en.ephoto360.com/1917-style-text-effect-523.html",
  arena: "https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html",
  hacker: "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html",
  sand: "https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html",
  blackpink: "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html",
  glitch: "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html",
  fire: "https://en.ephoto360.com/flame-lettering-effect-372.html",
}

module.exports={
  name:"metallic",
  react:"🎨",
  alias:Object.keys(EFFECTS), // .ice .snow .neon etc all work from one file
  category:"logo",
  desc:"Ephoto text effects",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid

    // Detect which effect was called: .metallic ProDev etc
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text || ""
    const prefix = body.trim().match(/^[.!#]?/)?.[0] || "."
    const usedCmd = body.trim().slice(1).split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g,"") // metallic, neon etc
    const type = EFFECTS[usedCmd] ? usedCmd : (args[0]?.toLowerCase() in EFFECTS ? args.shift().toLowerCase() : "metallic")
    const text = args.join(" ").trim()

    if(!text){
      return sock.sendMessage(jid,{
        text:`*🎨 TEXTMAKER*\n\nUsage: .${type} YourText\n\nAvailable:\n${Object.keys(EFFECTS).join(", ")}\n\nExample:\n.metallic APPLE\n.neon META AI\n\n${WATERMARK}`
      },{quoted:m})
    }

    const url = EFFECTS[type]
    if(!url) return sock.sendMessage(jid,{text:`❌ Unknown effect: ${type}`},{quoted:m})

    try{
      await sock.sendMessage(jid,{react:{text:"🎨",key:m.key}})
      await sock.sendMessage(jid,{text:`⏳ Generating *${type}* for "${text}"...\n\n${WATERMARK}`},{quoted:m})

      const result = await mumaker.ephoto(url, text)
      if(!result?.image) throw new Error('No image returned')

      await sock.sendMessage(jid,{
        image:{url: result.image},
        caption:`*${type.toUpperCase()} - ${text}*\n\n${WATERMARK}`
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log(`[${type}] error:`, e.message)
      await sock.sendMessage(jid,{text:`❌ Failed ${type}: ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
