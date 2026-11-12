const { api } = require('../lib/api')

const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"
const giphyApiKey = 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq'

module.exports={
  name:"giphy",
  react:"🎬",
  alias:["gif","gifs"],
  category:"fun",
  desc:"Search GIF from Giphy using lib/api.js",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const query = args.join(" ").trim()

    if(!query){
      return sock.sendMessage(jid,{
        text:`❌ Usage: .giphy cat dance\n\nExample:\n.giphy love\n.giphy anime laugh\n\n${WATERMARK}`
      },{quoted:m})
    }

    try{
      await sock.sendMessage(jid,{react:{text:"🎬",key:m.key}})

      // Using your lib/api.js axios instance
      const { data } = await api.get('https://api.giphy.com/v1/gifs/search',{
        params:{
          api_key: giphyApiKey,
          q: query,
          limit: 20,
          rating: 'g',
          lang: 'en'
        }
      })

      if(!data?.data?.length){
        return sock.sendMessage(jid,{text:`❌ No GIF found for *${query}*\n\n${WATERMARK}`},{quoted:m})
      }

      const random = data.data[Math.floor(Math.random()*data.data.length)]
      const gifUrl = random.images.original.url
      const title = random.title || query

      await sock.sendMessage(jid,{
        video:{url:gifUrl},
        gifPlayback:true,
        caption:`*🎬 ${title}*\n🔎 Query: ${query}\n\n${WATERMARK}`
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log('[giphy] error:', e.message)
      await sock.sendMessage(jid,{react:{text:"❌",key:m.key}})
      return sock.sendMessage(jid,{text:`❌ Giphy failed\n${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}

