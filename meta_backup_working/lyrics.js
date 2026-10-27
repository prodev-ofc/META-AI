const axios = require('axios')
const yts = require('yt-search')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
async function ytSearch(q){ const s=await yts(q); if(!s.videos.length) return null; const v=s.videos[0]; return { url:v.url, title:v.title, artist:v.author.name, channel:v.author.name, thumbnail:v.thumbnail, duration:v.timestamp, views:v.views.toLocaleString(), ago:v.ago } }

async function getLyrics(query, ytInfo){
  const title = ytInfo?.title || query
  const artist = ytInfo?.artist || ""
  
  // clean title for search
  const cleanTitle = title.replace(/\(.*\)|\[.*\]/g,'').replace(/Official.*|Video.*|Lyrics.*/gi,'').trim()
  const searchQueries = [
    query,
    `${artist} ${cleanTitle}`,
    cleanTitle,
    `${artist} - ${cleanTitle}`,
    title
  ]

  const apis = []

  for(const q of searchQueries){
    const parts = q.split(/ - | by /i)
    let a = "", t = q
    if(parts.length>1){ a=parts[0].trim(); t=parts.slice(1).join(" ").trim() }
    else if(artist){ a=artist; t=cleanTitle }

    apis.push(
      async ()=>{
        const url=`https://lyrist.vercel.app/api/${encodeURIComponent(a||artist||"alan walker")}/${encodeURIComponent(t||cleanTitle)}`
        const {data}=await axios.get(url,{timeout:10000})
        if(data.lyrics) return data.lyrics
        return null
      },
      async ()=>{
        const url=`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(t||q)}`
        const {data}=await axios.get(url,{timeout:10000})
        if(data.lyrics) return data.lyrics
        return null
      },
      async ()=>{
        const url=`https://api.lyrics.ovh/v1/${encodeURIComponent(a||artist||"Alan Walker")}/${encodeURIComponent(t||cleanTitle)}`
        const {data}=await axios.get(url,{timeout:10000})
        if(data.lyrics) return data.lyrics
        return null
      },
      async ()=>{
        const url=`https://api.davidcyriltech.my.id/search/lyrics?q=${encodeURIComponent(q)}`
        const {data}=await axios.get(url,{timeout:15000})
        return data.result?.lyrics || data.lyrics || null
      }
    )
  }

  for(const fn of apis){
    try{ const r=await fn(); if(r && r.length>30) return r }catch(e){}
  }
  return null
}

module.exports={
  name:"lyrics",
  react:"📑",
  alias:["lyric","lirik","ly"],
  category:"download",
  async execute(sock,m,args){
    const jid=m.key.remoteJid
    if(!args[0]) return sock.sendMessage(jid,{text:`Example: .lyrics Alan Walker Alone\n\n${WATERMARK}`},{quoted:m})
    await sock.sendMessage(jid,{react:{text:"🔍",key:m.key}})
    const query=args.join(" ")
    const video=await ytSearch(query)
    const title=video?.title || query
    const artist=video?.artist || query

    const caption=`*╭┈───〔 META-AI YTDL 〕┈───⊷*\n*├• 🗣 Artist:* ${artist}\n*├• 📋 Title:* ${title}\n*├• 📺 Channel:* ${video?.channel || artist}\n*├• ⏰ Duration:* ${video?.duration || "-"}\n*├• 👀 Views:* ${video?.views || "-"}\n*├• 📅 Released:* ${video?.ago || "-"}\n*╰───────────────────⊷*\n\n${WATERMARK}\n\n*_searching lyrics.._*`
    if(video) await sock.sendMessage(jid,{image:{url:video.thumbnail},caption},{quoted:m})
    else await sock.sendMessage(jid,{text:caption},{quoted:m})

    const lyrics=await getLyrics(query, video)
    if(!lyrics){
      await sock.sendMessage(jid,{react:{text:"❌",key:m.key}})
      return sock.sendMessage(jid,{text:`❌ Lyrics not found for *${query}*\n\nTry: .lyrics ${artist} - ${title}\n\n${WATERMARK}`},{quoted:m})
    }
    const out=`*╭┈───〔 📑 LYRICS 〕┈───⊷*\n*├• 🎵 Title:* ${title}\n*├• 🗣 Artist:* ${artist}\n*╰───────────────────⊷*\n\n${lyrics.substring(0,3800)}\n\n${WATERMARK}`
    await sock.sendMessage(jid,{text:out},{quoted:m})
    await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
  }
}
