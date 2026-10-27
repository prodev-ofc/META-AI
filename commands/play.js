module.exports = {
  name: "play",
  alias: [],
  category: "download",
  desc: "Audio type",
  async execute(sock, m, args, commands){
    const cfg = require('../config')
    const { box } = require('../utils')
    const yts = require('yt-search')
    const ytdl = require('@distube/ytdl-core')
    const fs = require('fs')
    const path = require('path')
    const query = args.join(' ')
    if(!query) return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Usage: ${cfg.prefix}play <song>`]) }, { quoted: m })
    try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "🎧", key: m.key } }) }catch{}
    const sent = await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`🔍 Searching audio...`, `> ${query}`]) }, { quoted: m })
    try{
      let url = query, title="Audio", thumb=null, duration="0:00"
      const isUrl = /youtu\.?be/.test(query)
      if(!isUrl){
        const s = await yts(query); if(!s.videos.length) throw new Error("No results"); url = s.videos[0].url; title = s.videos[0].title; thumb = s.videos[0].thumbnail; duration = s.videos[0].timestamp
      } else {
        // if link, get info from yts
        try{ const id = ytdl.getVideoID(query); const info = await yts({ videoId: id }); title = info.title; thumb = info.thumbnail; duration = info.timestamp; url = info.url }catch{}
      }
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`⬇️ Downloading...`, `> ${title}`, `> ${duration}`]), edit: sent.key })
      const file = path.join(__dirname, '../tmp', `${Date.now()}.mp3`)
      console.log("DL:", url, "->", file)
      await new Promise((res, rej)=>{
        const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
        const ws = fs.createWriteStream(file)
        stream.on('error', rej)
        ws.on('finish', res)
        stream.pipe(ws)
      })
      if(thumb){ await sock.sendMessage(m.key.remoteJid, { image: { url: thumb }, caption: box(cfg, [`🎵 ${title}`, `⏱️ ${duration}`, `🔗 ${url}`]) }, { quoted: m }).catch(()=>{}) }
      await sock.sendMessage(m.key.remoteJid, { audio: { url: file }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: m })
      if(fs.existsSync(file)) fs.unlinkSync(file)
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`✅ Audio sent`, `🎵 ${title}`]), edit: sent.key })
      try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } }) }catch{}
    }catch(e){ console.log("PLAY ERR:", e); await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`❌ ${e.message}`]), edit: sent.key }); try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } }) }catch{} }
  }
}
