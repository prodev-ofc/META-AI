const yts = require('yt-search')
const APIs = require('../lib/api')

const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"

async function ytSearch(q){
  const s=await yts(q)
  if(!s.videos.length) return null
  const v=s.videos[0]
  return {
    url:v.url,
    title:v.title,
    artist:v.author.name,
    channel:v.author.name,
    thumbnail:v.thumbnail,
    duration:v.timestamp,
    views:v.views.toLocaleString(),
    ago:v.ago
  }
}

module.exports={
  name:"song",
  react:"🎧",
  alias:["songdoc","playdoc"],
  category:"download",
  desc:"Download YT audio via Knight API",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const q=args.join(" ").trim()
    if(!q) return sock.sendMessage(jid,{text:`Example: .song Alone\n\n${WATERMARK}`},{quoted:m})

    try{
      await sock.sendMessage(jid,{react:{text:"🔍",key:m.key}})
      const video=await ytSearch(q)
      if(!video) return sock.sendMessage(jid,{text:`❌ Not found\n\n${WATERMARK}`},{quoted:m})

      const caption=`*╭┈───〔 META-AI YTDL 〕┈───⊷*\n*├• 🗣 Artist:* ${video.artist}\n*├• 📋 Title:* ${video.title}\n*├• 📺 Channel:* ${video.channel}\n*├• ⏰ Duration:* ${video.duration}\n*├• 👀 Views:* ${video.views}\n*├• 📅 Released:* ${video.ago}\n*╰───────────────────⊷*\n\n${WATERMARK}\n\n*_downloading.._*`

      await sock.sendMessage(jid,{image:{url:video.thumbnail},caption},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"⬇️",key:m.key}})

      let result=null
      const methods=[
        ['Knight', ()=>APIs.knightSongDownload(video.url)],
        ['Hector', ()=>APIs.hectorSongDownload(video.url)],
        ['Prince', ()=>APIs.princeSongDownload(video.url)],
        ['Prexzy', ()=>APIs.prexzySongDownload(video.url)],
        ['Elite', ()=>APIs.getEliteProTechDownloadByUrl(video.url)],
        ['Yupra', ()=>APIs.getYupraDownloadByUrl(video.url)],
      ]

      for(const [name, fn] of methods){
        try{
          console.log(`[song] trying ${name}...`)
          result=await fn()
          if(result?.download) { console.log(`[song] OK via ${name}`); break; }
        }catch(e){ console.log(`[song] ${name} failed:`, e.message) }
      }

      if(!result?.download) throw new Error('All APIs failed, try again later')

      // Send as document like your old version
      await sock.sendMessage(jid,{
        document:{url:result.download},
        mimetype:"audio/mpeg",
        fileName:`${video.title}.mp3`,
        caption:`*${video.title}*\n\n${WATERMARK}`
      },{quoted:m})

      // Also send as audio for play in chat
      await sock.sendMessage(jid,{
        audio:{url:result.download},
        mimetype:"audio/mpeg",
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.error('[song] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Failed: ${e.message}\n\n${WATERMARK}`},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"❌",key:m.key}})
    }
  }
}
