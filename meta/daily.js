const { getUser, updateUser } = require('../utils/economy')
module.exports = {
  name: 'daily',
  category: 'economy',
  react: '🎁',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const user = getUser(sender)
    const now = Date.now()
    const cooldown = 24 * 60 * 60 * 1000

    if (now - user.lastDaily < cooldown) {
      const left = cooldown - (now - user.lastDaily)
      const h = Math.floor(left / 3600000)
      const min = Math.floor((left % 3600000) / 60000)
      return sock.sendMessage(jid, { text: `⏳ Come back in ${h}h ${min}m for daily reward` }, { quoted: m })
    }

    const reward = Math.floor(Math.random() * 500) + 500 // 500-1000
    updateUser(sender, { wallet: user.wallet + reward, lastDaily: now })

    await sock.sendMessage(jid, {
      text: `🎁 *DAILY REWARD*\n\n💰 You claimed $${reward}!\n💵 Wallet: $${user.wallet + reward}`,
      mentions: [sender]
    }, { quoted: m })
  }
}
