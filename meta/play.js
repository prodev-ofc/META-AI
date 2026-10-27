const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const yts = require('yt-search')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
const TEMP_DIR = path.join(__dirname, '..', 'temp')
if(!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, {recursive:true})

function ytDlpDownload(url, type='mp3'){
  return new Promise((resolve, reject)=>{
    const id = Date.now()
    const outTemplate = path.join(TEMP_DIR, `${id}.%(ext)s`)
    let cmd = ''
    if(type==='mp3') cmd = `yt-dlp --js-runtimes node -x --audio-format mp3 --audio-quality 128K --no-playlist -o "${outTemplate}" "${url}"`
    else cmd = `yt-dlp --js-runtimes node -f "bestaudio" --no-playlist -o "${outTemplate}" "${url}"`
    exec(cmd, {timeout: 120000}, (err, stdout, stderr)=>{
      if(err) return reject(new Error(stderr || err.message))
      const files=fs.readdirSync(TEMP_DIR).filter(f=>f.startsWith(String(id)))
      if(!files.length) return reject(new Error('no file created: '+stderr))
      resolve(path.join(TEMP_DIR, files[0]))
    })
  })
}
async function ytSearch(q){ const s=await yts(q); if(!s.videos.length) return null; const v=s.videos[0]; return { url:v.url, title:v.title, artist:v.author.name, channel:v.author.name, thumbnail:v.thumbnail, duration:v.timestamp, views:v.views.toLocaleString(), ago:v.ago } }

module.exports={
  name:"play",
  react:"🎵",
  alias:["yt"],
  category:"download",
  async execute(sock,m,args){
    const jid=m.key.remoteJid
    if(!args[0]) return sock.sendMessage(jid,{text:`Example: .play Alone\n\n${WATERMARK}`},{quoted:m})
    await sock.sendMessage(jid,{react:{text:"🔍",key:m.key}})
    const video=await ytSearch(args.join(" "))
    if(!video) return sock.sendMessage(jid,{text:`❌ Not found\n\n${WATERMARK}`},{quoted:m})
    const caption=`*╭┈───〔 META-AI YTDL 〕┈───⊷*\n*├• 🗣 Artist:* ${video.artist}\n*├• 📋 Title:* ${video.title}\n*├• 📺 Channel:* ${video.channel}\n*├• ⏰ Duration:* ${video.duration}\n*├• 👀 Views:* ${video.views}\n*├• 📅 Released:* ${video.ago}\n*╰───────────────────⊷*\n\n${WATERMARK}\n\n*_downloading.._*`
    await sock.sendMessage(jid,{image:{url:video.thumbnail},caption},{quoted:m})
    await sock.sendMessage(jid,{react:{text:"⬇️",key:m.key}})
    try{
      const file=await ytDlpDownload(video.url,'mp3')
      await sock.sendMessage(jid,{audio:fs.readFileSync(file),mimetype:"audio/mpeg"},{quoted:m})
      fs.unlinkSync(file)
      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
    }catch(e){ console.log(e.message); await sock.sendMessage(jid,{text:`❌ ${e.message}\n\n${WATERMARK}`},{quoted:m}); await sock.sendMessage(jid,{react:{text:"❌",key:m.key}}) }
  }
}
