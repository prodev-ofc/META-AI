module.exports = {
  name: "menu",
  alias: ["help","commands"],
  category: "general",
  desc: "Show all commands",
  async execute(sock,m,args,commands){
    const cfg = require('../config')
    let text = `*${cfg.botName} MENU*\n\n`
    text += `*Bot:* ${cfg.botNumber}\n`
    text += `*Prefix:* ${cfg.prefix}\n`
    text += `*Owners:* ${Array.isArray(cfg.owner)?cfg.owner.join(', '):cfg.owner}\n\n`
    text += `*COMMANDS:*\n`
    const unique = [...new Set([...commands.values()])]
    for(const c of unique){
      text += `• ${cfg.prefix}${c.name} - ${c.desc||'No desc'}\n`
    }
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
  }
}
