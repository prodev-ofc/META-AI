module.exports = {
  name: "ping",
  alias: ["p"],
  category: "general",
  desc: "Ping with edit",
  async execute(sock, m, args, commands){
    const cfg = require('../config')
    const { box } = require('../utils')
    const start = Date.now()
    const sent = await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Pinging...`]) }, { quoted: m })
    await new Promise(r=>setTimeout(r,700))
    const ping = Date.now() - start
    await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Pong  ${ping} ms`]), edit: sent.key })
  }
}
