module.exports = {
  name: "ping",
  alias: ["p","speed"],
  desc: "Check bot speed",
  execute: async (sock, m, args) => {
    const start = Date.now()
    const cfg = require('../config')
    const owners = Array.isArray(cfg.owner) ? cfg.owner : [cfg.owner]
    
    // send reaction
    try{
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🏓", key: m.key } })
    }catch{}
    
    const latency = Date.now() - start
    const uptime = process.uptime()
    const hours = Math.floor(uptime / 3600)
    const mins = Math.floor((uptime % 3600) / 60)
    const secs = Math.floor(uptime % 60)
    
    const text = `*🏓 PONG!*\n\n` +
                 `*Speed:* ${latency}ms\n` +
                 `*Uptime:* ${hours}h ${mins}m ${secs}s\n` +
                 `*Bot:* ${cfg.botNumber || "263788279395"}\n` +
                 `*Owners:* ${owners.join(', ')}\n` +
                 `*Prefix:* ${cfg.prefix}\n\n` +
                 `_META AI - Online ✅_`
    
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
  }
}
