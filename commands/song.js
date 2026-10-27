module.exports = {
  name: "song",
  alias: [],
  category: "download",
  desc: "Document type",
  async execute(sock, m, args, commands){
    const cfg = require('../config')
    const { box } = require('../utils')
    const yts = require('yt-search')
    const ytdl = require('@distube/ytdl-core')
    const fs = require('fs')
    const path = require('path')
    const query = args.join(' ')
    if(!query) return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Usage: ${cfg.prefix}song <song>`]) }, { quoted: m })
    try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "🎵", key: m.key } }) }catch{}
    const sent = await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`🔍 Searching doc...`, `> ${query}`]) }, { quoted: m })
    try{
      let url = query, title="Song", thumb=null, duration="0:00"
      const isUrl = /youtu\.?be/.test(query)
      if(!isUrl){ const s = await yts(query); url = s.videos[0].url; title = s.videos[0].title; thumb = s.videos[0].thumbnail; duration = s.videos[0].timestamp }
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`⬇️ Downloading doc...`, `> ${title}`]), edit: sent.key })
      const file = path.join(__dirname, '../tmp', `${Date.now()}.mp3`)
      await new Promise((r,j)=>{ const st=ytdl(url,{filter:'audioonly',quality:'highestaudio'}); const ws=fs.createWriteStream(file); st.on('error',j); ws.on('finish',r).on('error',j); st.pipe(ws) })
      if(thumb){ await sock.sendMessage(m.key.remoteJid, { image: { url: thumb }, caption: box(cfg, [`🎵 ${title}`, `📁 Document`]) }, { quoted: m }).catch(()=>{}) }
      await sock.sendMessage(m.key.remoteJid, { document: { url: file }, mimetype: 'audio/mpeg', fileName: `${title}.mp3`, caption: box(cfg, [`🎵 ${title}`, `⏱️ ${duration}`]) }, { quoted: m })
      if(fs.existsSync(file)) fs.unlinkSync(file)
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`✅ Doc sent`]), edit: sent.key })
      try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } }) }catch{}
    }catch(e){ console.log(e); await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`❌ ${e.message}`]), edit: sent.key }) }
  }
}
