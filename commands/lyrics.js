module.exports = {
  name: "lyrics",
  alias: ["lyric"],
  category: "search",
  desc: "Lyrics",
  async execute(sock,m,args,commands){
    const cfg = require('../config')
    const { box } = require('../utils')
    const axios = require('axios')
    const query = args.join(' ')
    if(!query) return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Usage: ${cfg.prefix}lyrics <song>`]) }, { quoted: m })

    try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "🎵", key: m.key } }) }catch{}
    const sent = await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`🎵 Searching lyrics...`, `> ${query}`]) }, { quoted: m })

    try{
      const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query.split(' ')[0])}/${encodeURIComponent(query.split(' ').slice(1).join(' ') || query)}`).catch(()=>null)
      let lyrics = res?.data?.lyrics
      if(!lyrics){
        const r2 = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query)}/${encodeURIComponent(query)}`).catch(()=>null)
        lyrics = r2?.data?.lyrics
      }
      if(!lyrics) throw new Error("Not found")
      if(lyrics.length > 3500) lyrics = lyrics.substring(0,3500) + "\n..."
      const header = box(cfg, [`🎵 LYRICS: ${query.toUpperCase()}`])
      await sock.sendMessage(m.key.remoteJid, { text: `${header}\n\n${lyrics}\n\n${cfg.watermark}` }, { quoted: m })
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`✅ Found`, `> ${query}`]), edit: sent.key }).catch(()=>{})
      try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } }) }catch{}
    }catch(e){
      await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`❌ Not found: ${query}`, `Try: artist + title`]), edit: sent.key })
      try{ await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } }) }catch{}
    }
  }
}
