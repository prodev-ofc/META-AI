const { getUser, updateUser } = require('../utils/economy')
module.exports = {
  name: 'beg',
  category: 'economy',
  react: '🥺',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const user = getUser(sender)
    const now = Date.now()
    if (now - user.lastBeg < 30000) return sock.sendMessage(jid, { text: `⏳ Beg again after 30s` }, { quoted: m })

    const success = Math.random() > 0.3
    if (!success) {
      updateUser(sender, { lastBeg: now })
      return sock.sendMessage(jid, { text: `😒 Nobody gave you money, go work!` }, { quoted: m })
    }

    const amount = Math.floor(Math.random() * 50) + 10
    updateUser(sender, { wallet: user.wallet + amount, lastBeg: now })
    await sock.sendMessage(jid, { text: `🥺 Someone gave you $${amount}!` }, { quoted: m })
  }
}
