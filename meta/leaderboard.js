const { getDB } = require('../utils/economy')
module.exports = {
  name: 'leaderboard',
  alias: ['lb', 'top', 'rich'],
  category: 'economy',
  react: '🏆',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const db = getDB()
    const sorted = Object.entries(db).sort((a,b) => (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank)).slice(0,10)

    let text = `╭━━〔 🏆 *TOP 10 RICH* 〕━━╮\n`
    sorted.forEach(([id, data], i) => {
      const total = data.wallet + data.bank
      text += `┃ ${i+1}. @${id.split('@')[0]} - $${total}\n`
    })
    text += `╰━━━━━━━━━━━━━━━━━━━━╯`

    await sock.sendMessage(jid, { text, mentions: sorted.map(s => s[0]) }, { quoted: m })
  }
}
