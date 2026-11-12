const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const yts = require('yt-search')
const settings = require('../settings')
const APIs = require('../lib/api')
const { fetchWhatsAppVideo } = require('../lib/waVideo')

const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"
const TEMP_DIR = path.join(__dirname, '..', 'temp')
if(!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, {recursive:true})

function isYouTubeUrl(text) { return /youtube\.com|youtu\.be/i.test(text) }
function extractUrl(text) { const m=String(text||'').match(/https?:\/\/[^\s]+/i); return m?m[0]:String(text||'').trim() }

function ytDlpDownload(url){
  return new Promise((resolve, reject)=>{
    const id = Date.now()
    const outTemplate = path.join(TEMP_DIR, `${id}.%(ext)s`)
    const cmd = `yt-dlp --js-runtimes node -f "best[height<=720][ext=mp4]/best" --no-playlist -o "${outTemplate}" "${url}"`
    exec(cmd, {timeout: 180000}, (err, stdout, stderr)=>{
      if(err) return reject(new Error(stderr || err.message))
      const files=fs.readdirSync(TEMP_DIR).filter(f=>f.startsWith(String(id)))
      if(!files.length) return reject(new Error('yt-dlp no file'))
      resolve(path.join(TEMP_DIR, files[0]))
    })
  })
}

async function resolveVideo(videoUrl) {
  const steps = [
    ['Knight', () => APIs.knightVideoDownload(videoUrl)],
    ['Prince', () => APIs.princeVideoDownload(videoUrl)],
    ['Hector', () => APIs.hectorVideoDownload(videoUrl)],
    ['EliteProTech', () => APIs.getEliteProTechVideoByUrl(videoUrl)],
    ['Yupra', () => APIs.getYupraVideoByUrl(videoUrl)],
    ['Okatsu', () => APIs.getOkatsuVideoByUrl(videoUrl)],
  ]
  let lastError
  for (const [name, run] of steps) {
    try {
      const result = await run()
      const download = result.download || result.dl_url || result.dl
      if (!download || !/^https?:\/\//i.test(download)) throw new Error('No download URL')
      console.log(`[video] OK via ${name}`)
      return { title: result.title || 'Video', download, sourceUrl: result.sourceUrl || videoUrl, isDirect:true }
    } catch (err) {
      lastError = err
      console.log(`[video] ${name} failed:`, err?.message || err)
    }
  }
  throw lastError || new Error('All API sources failed')
}

async function ytSearch(q){ 
  const s=await yts(q); 
  if(!s.videos.length) return null; 
  const v=s.videos[0]; 
  return { url:v.url, title:v.title, artist:v.author?.name||'YT', channel:v.author?.name||'YT', thumbnail:v.thumbnail, duration:v.timestamp, views:(v.views||0).toLocaleString(), ago:v.ago, raw:v } 
}

module.exports={
  name:"video",
  react:"🎥",
  alias:["mp4","ytmp4","ytv","ytvid"],
  category:"download",
  desc:"Download YouTube video",
  async execute(sock,m,args){
    const jid=m.key.remoteJid
    const text = args.join(" ").trim() || (m.message?.conversation || m.message?.extendedTextMessage?.text || '').replace(/^\.(?:video|ytmp4|ytv|ytvid)\s*/i,'').trim()

    if(!text) return sock.sendMessage(jid,{text:`Usage: .video <name or YouTube URL>\n\nExample: .video Alone\n\n${WATERMARK}`},{quoted:m})

    await sock.sendMessage(jid,{react:{text:"🔍",key:m.key}})

    let preview, videoUrl

    if(isYouTubeUrl(text)){
      videoUrl = extractUrl(text)
      const ytId = (videoUrl.match(/(?:youtu\.be\/|v=|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1]
      preview = { title:'YouTube Video', thumbnail: ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : null, raw:{title:'YouTube Video'} }
    } else {
      preview = await ytSearch(text)
      if(!preview) return sock.sendMessage(jid,{text:`❌ No results found for "${text}"\n\n${WATERMARK}`},{quoted:m})
      videoUrl = preview.url
    }

    // Send preview
    const infoText = `*╭┈───〔 META-AI YTDL 〕┈───⊷*\n*├• 📋 Title:* ${preview.title||preview.raw?.title}\n*├• ⏰ Duration:* ${preview.duration||preview.raw?.timestamp||'—'}\n*├• 👀 Views:* ${preview.views||'—'}\n*╰───────────────────⊷*\n\n${WATERMARK}\n\n*_downloading.._*`

    try{
      if(preview.thumbnail) await sock.sendMessage(jid,{image:{url:preview.thumbnail}, caption:infoText},{quoted:m})
      else await sock.sendMessage(jid,{text:infoText},{quoted:m})
    }catch{
      await sock.sendMessage(jid,{text:infoText},{quoted:m})
    }

    try{
      // 1) Try APIs first (fast on panels)
      try{
        const dl = await resolveVideo(videoUrl)
        const video = await fetchWhatsAppVideo(dl.download)
        const botName = settings.botName || 'META-AI'
        const title = dl.title || preview.title || 'Video'
        const fileName = `${title.replace(/[^\w\s-]/g,'').trim() || 'video'}.mp4`
        await sock.sendMessage(jid,{video, mimetype:'video/mp4', fileName, caption:`*${title}*\n\n${WATERMARK}`},{quoted:m})
        await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
        return
      }catch(apiErr){
        console.log('[video] APIs failed, trying yt-dlp:', apiErr.message)
        // 2) Fallback yt-dlp
        const file = await ytDlpDownload(videoUrl)
        await sock.sendMessage(jid,{video:fs.readFileSync(file), mimetype:"video/mp4", fileName:`${preview.title||'video'}.mp4`, caption:`*${preview.title||'Video'}*\n\n${WATERMARK}`},{quoted:m})
        try{ fs.unlinkSync(file) }catch{}
        await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
        return
      }

    }catch(e){
      console.log('[video] final error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Download failed: ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
