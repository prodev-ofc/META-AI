module.exports = {
  name: "yt",
  alias: ["ytdl","ytsearch","yts","video"],
  category: "download",
  desc: "YT link + thumbnail",
  async execute(sock, m, args, commands){
    const cfg = require('../config')
    const { box } = require('../utils')
    const yts = require('yt-search')
    const ytdl = require('@distube/ytdl-core')
    const fs = require('fs')
    const path = require('path')
    const query = args.join(' ')
    if(!query) return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Usage: ${cfg.prefix}yt <link/name>`]) }, { quoted: m })
    try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } }) }catch{}
    const sent = await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`🔍 YT Searching...`, `> ${query}`]) }, { quoted: m })
    try{
      let url = query, title, thumbnail, duration, views, author
      const isUrl = /youtu\.?be/.test(query)
      if(isUrl){ const id = ytdl.getVideoID(query); const info = await yts({ videoId: id }); url = info.url; title = info.title; thumbnail = info.thumbnail; duration = info.timestamp; views = info.views; author = info.author.name }
      else { const s = await yts(query); const v = s.videos[0]; url = v.url; title = v.title; thumbnail = v.thumbnail; duration = v.timestamp; views = v.views; author = v.author.name }
      
      // mpng
      await sock.sendMessage(m.key.remoteJid, { image: { url: thumbnail }, caption: box(cfg, [`🎬 ${title}`, `👤 ${author}`, `⏱️ ${duration}`, `👁️ ${views}`, `🔗 ${url}`]) }, { quoted: m })
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`⬇️ Downloading...`, `> ${title}`]), edit: sent.key })
      
      const tempA = path.join(__dirname, '../tmp', `${Date.now()}a.mp3`)
      await new Promise((r,j)=>{ const st=ytdl(url,{filter:'audioonly',quality:'highestaudio'}); const ws=fs.createWriteStream(tempA); st.on('error',j); ws.on('finish',r).on('error',j); st.pipe(ws) })
      await sock.sendMessage(m.key.remoteJid, { audio: { url: tempA }, mimetype: 'audio/mpeg' }, { quoted: m })
      await sock.sendMessage(m.key.remoteJid, { document: { url: tempA }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` })

      const tempV = path.join(__dirname, '../tmp', `${Date.now()}v.mp4`)
      await new Promise((r,j)=>{ const st=ytdl(url,{filter:'videoandaudio',quality:'lowest'}); const ws=fs.createWriteStream(tempV); st.on('error',j); ws.on('finish',r).on('error',j); st.pipe(ws) })
      await sock.sendMessage(m.key.remoteJid, { video: { url: tempV }, mimetype: 'video/mp4', caption: box(cfg, [`🎬 ${title}`]) })
      
      if(fs.existsSync(tempA)) fs.unlinkSync(tempA)
      if(fs.existsSync(tempV)) fs.unlinkSync(tempV)
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`✅ YT Done`, `🎬 ${title}`]), edit: sent.key })
      try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } }) }catch{}
    }catch(e){ console.log("YT ERR:", e); await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`❌ ${e.message}`]), edit: sent.key }) }
  }
}
