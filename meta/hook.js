const axios = require('axios')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { uploadImage } = require('../lib/uploadImage')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const FormData = require('form-data')

const WATERMARK = "> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"
const TMP = '/data/data/com.termux/files/home/META-AI/tmp'
if(!fs.existsSync(TMP)) fs.mkdirSync(TMP,{recursive:true})

async function downloadMedia(msg, type){
  const stream = await downloadContentFromMessage(msg, type)
  const chunks=[]; for await(const c of stream) chunks.push(c)
  return Buffer.concat(chunks)
}

// Extract 15 sec audio from video for Shazam - THIS WAS MISSING
async function extractAudio(videoBuffer){
  const id = Date.now()
  const vidPath = path.join(TMP, `hook_${id}.mp4`)
  const audPath = path.join(TMP, `hook_${id}.mp3`)
  fs.writeFileSync(vidPath, videoBuffer)
  // ffmpeg: take 0-15s, mono, 44100, 128k - Shazam needs this
  await execAsync(`ffmpeg -y -i "${vidPath}" -t 15 -vn -ac 1 -ar 44100 -b:a 128k "${audPath}"`)
  const buf = fs.readFileSync(audPath)
  fs.unlinkSync(vidPath); fs.unlinkSync(audPath)
  return buf
}

async function shazamIdentify(audioBuffer){
  // Try 1: siputzx shazam - correct field is 'audio'
  try{
    const form = new FormData()
    form.append('audio', audioBuffer, { filename: 'sample.mp3', contentType: 'audio/mpeg' })
    const res = await axios.post('https://api.siputzx.my.id/api/tools/shazam', form, { headers: form.getHeaders(), timeout: 40000 })
    const d = res.data?.data || res.data?.result
    if(d && (d.title || d.song)) return { title: d.title||d.song, artist: d.artist||d.subtitle||d.singer, album: d.album, image: d.image||d.cover }
  }catch(e){ console.log('[hook shazam1]', e.message) }

  // Try 2: AudD - needs AUDD_TOKEN in .env, fallback if set
  if(process.env.AUDD_TOKEN){
    try{
      const form = new FormData()
      form.append('file', audioBuffer, { filename: 'sample.mp3', contentType: 'audio/mpeg' })
      form.append('api_token', process.env.AUDD_TOKEN)
      form.append('return', 'apple_music,spotify')
      const res = await axios.post('https://api.audd.io/', form, { headers: form.getHeaders(), timeout: 40000 })
      const r = res.data?.result
      if(r) return { title: r.title, artist: r.artist, album: r.album, image: r.spotify?.album?.images?.[0]?.url }
    }catch(e){ console.log('[hook audd]', e.message) }
  }

  // Try 3: Shazam unofficial - via rapidapi style endpoint
  try{
    const form = new FormData()
    form.append('file', audioBuffer, { filename: 'sample.mp3' })
    const res = await axios.post('https://shazam-api6.p.rapidapi.com/shazam/recognize/', form, { headers: { ...form.getHeaders(), 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY||'', 'X-RapidAPI-Host': 'shazam-api6.p.rapidapi.com' }, timeout: 30000 })
    const track = res.data?.track
    if(track) return { title: track.title, artist: track.subtitle, album: '', image: track.images?.coverart }
  }catch{}

  return null
}

// HOOK INTO play.js - actually download song, not just text
async function downloadSong(sock, jid, m, title, artist){
  const query = `${title} ${artist||''}`.trim()
  await sock.sendMessage(jid,{text:`🎵 Found: *${title} - ${artist}*\n\nDownloading via play.js... ⏳\n\n${WATERMARK}`},{quoted:m})
  try{
    // Use same API play.js uses
    const search = await axios.get(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`, {timeout:20000})
    const video = search.data?.data?.[0] || search.data?.[0]
    const url = video?.url || video?.link
    if(!url) throw new Error('No YouTube result')

    const dl = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`, {timeout:60000})
    const audioUrl = dl.data?.data?.dl || dl.data?.data?.url || dl.data?.url
    if(!audioUrl) throw new Error('No download link')

    await sock.sendMessage(jid,{
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      caption: `🎵 *${title}*\n👤 ${artist}\n\n${WATERMARK}`
    },{quoted:m})
    return true
  }catch(e){
    console.log('[hook downloadSong]', e.message)
    await sock.sendMessage(jid,{text:`Found song but download failed.\n\nUse: .play ${query}\n\n${WATERMARK}`},{quoted:m})
    return false
  }
}

async function aiExplain(prompt){
  try{
    const res = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`, {timeout:20000})
    return res.data?.data || res.data?.result
  }catch{ return null }
}

async function googleSearch(q){
  try{
    const res = await axios.get(`https://api.siputzx.my.id/api/s/google?query=${encodeURIComponent(q)}`, {timeout:15000})
    return res.data?.data
  }catch{ return null }
}

module.exports={
  name:"hook",
  react:"🪝",
  alias:["shazam","whatsong","findsong"],
  category:"tools",
  desc:"Hook - Identify song in video/audio/image and download it",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const queryRaw = args.join(' ').trim().toLowerCase()
    const isMusic = /song|music|audio|shazam|play|mp3|track/.test(queryRaw) || !queryRaw // default for video/audio = song

    try{
      await sock.sendMessage(jid,{react:{text:"🪝",key:m.key}})

      if(!quotedMsg){
        if(!args.length) return sock.sendMessage(jid,{text:`*🪝 HOOK*\n\nReply to video/audio/image with .hook song\nReply to text with .hook\n\n${WATERMARK}`},{quoted:m})
        const q = args.join(' ')
        const ai = await aiExplain(`Explain in detail: ${q}`)
        return sock.sendMessage(jid,{text:`*🪝 ${q}*\n\n${ai||'No info'}\n\n${WATERMARK}`},{quoted:m})
      }

      const qVideo = quotedMsg?.videoMessage
      const qAudio = quotedMsg?.audioMessage
      const qImage = quotedMsg?.imageMessage
      const qText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || quotedMsg?.imageMessage?.caption || quotedMsg?.videoMessage?.caption || ""

      // ===== VIDEO - REAL AUDIO IDENTIFY =====
      if(qVideo){
        await sock.sendMessage(jid,{text:`🎬 Analyzing video audio...\nExtracting 15s sample → Shazam...\n\n${WATERMARK}`},{quoted:m})
        const videoBuf = await downloadMedia(qVideo, 'video')
        let audioBuf
        try{ audioBuf = await extractAudio(videoBuf) }catch(e){ audioBuf = videoBuf } // fallback if no ffmpeg

        const song = await shazamIdentify(audioBuf)
        if(!song){
          return sock.sendMessage(jid,{text:`❌ Could not identify song.\n\nReasons: video has no clear music / too noisy / too short.\nTry replying to clearer part or with .hook song on audio.\n\n${WATERMARK}`},{quoted:m})
        }

        // TRUE INFO + DOWNLOAD
        const info = await aiExplain(`Give true info about song: "${song.title}" by "${song.artist}". Release year, album, genre, meaning, artist background, lyrics theme. Be factual.`)
        const g = await googleSearch(`${song.title} ${song.artist} song`)

        let out = `*🎵 SONG IDENTIFIED*\n\n`
        out += `*Title:* ${song.title}\n*Artist:* ${song.artist}\n${song.album?`*Album:* ${song.album}\n`:''}\n`
        if(info) out += `\n*📖 About:*\n${info}\n`
        if(g && Array.isArray(g)) out += `\n*🔍 Sources:*\n` + g.slice(0,3).map(x=>`• ${x.title}\n${x.link}`).join('\n')
        out += `\n\n${WATERMARK}`

        await sock.sendMessage(jid,{text:out},{quoted:m})
        // HOOK PLAY.JS - DOWNLOAD SAME SONG
        await downloadSong(sock, jid, m, song.title, song.artist)
        return
      }

      // ===== AUDIO / VOICE =====
      if(qAudio){
        await sock.sendMessage(jid,{text:`🎧 Listening...\n\n${WATERMARK}`},{quoted:m})
        const audioBuf = await downloadMedia(qAudio, 'audio')
        const song = await shazamIdentify(audioBuf)
        if(!song) return sock.sendMessage(jid,{text:`❌ Could not identify this audio.\n\n${WATERMARK}`},{quoted:m})
        await sock.sendMessage(jid,{text:`*🎵 ${song.title} - ${song.artist}*\n\n${WATERMARK}`},{quoted:m})
        await downloadSong(sock, jid, m, song.title, song.artist)
        return
      }

      // ===== IMAGE WITH SONG =====
      if(qImage){
        const buf = await downloadMedia(qImage, 'image')
        const url = await uploadImage(buf)
        let ocr=""
        try{
          const ocrRes = await axios.get(`https://api.siputzx.my.id/api/tools/ocr?url=${encodeURIComponent(url)}`, {timeout:20000})
          ocr = ocrRes.data?.data?.text || ""
        }catch{}
        if(!ocr && !qText) return sock.sendMessage(jid,{text:`No text in image to identify song. Reply to video/audio for Shazam.\n\n${WATERMARK}`},{quoted:m})
        const searchTerm = (ocr||qText).slice(0,200)
        const ai = await aiExplain(`Text from image: "${searchTerm}". Identify exact song name and artist. If lyrics, find song.`)
        await sock.sendMessage(jid,{text:`*🖼️ Image Text:* ${searchTerm}\n\n*🎵 AI:* ${ai}\n\n${WATERMARK}`},{quoted:m})
        // Try download if AI gave song
        if(ai) await downloadSong(sock, jid, m, searchTerm, '')
        return
      }

      // ===== TEXT =====
      if(qText){
        const ai = await aiExplain(`Explain in depth with facts: ${qText}. User also asks: ${args.join(' ')}`)
        const g = await googleSearch(qText)
        let out = `*🪝 ${qText.slice(0,100)}*\n\n${ai||''}\n\n`
        if(g && Array.isArray(g)) out += `*🔍*\n` + g.slice(0,3).map(x=>`• ${x.title}\n${x.link}`).join('\n')
        out += `\n\n${WATERMARK}`
        return sock.sendMessage(jid,{text:out},{quoted:m})
      }

    }catch(e){
      console.log('[hook]', e.message)
      await sock.sendMessage(jid,{text:`❌ Hook failed: ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
