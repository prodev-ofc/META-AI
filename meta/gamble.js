const { getUser, updateUser } = require('../utils/economy')
module.exports = {
  name: 'gamble',
  alias: ['bet', 'flip'],
  category: 'economy',
  react: '🎲',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const user = getUser(sender)
    let amount = parseInt(args[0])
    if (!amount || amount <= 0) return sock.sendMessage(jid, { text: `Usage: .gamble 100` }, { quoted: m })
    if (user.wallet < amount) return sock.sendMessage(jid, { text: `❌ You have $${user.wallet}, not enough` }, { quoted: m })

    const win = Math.random() > 0.5
    if (win) {
      updateUser(sender, { wallet: user.wallet + amount })
      await sock.sendMessage(jid, { text: `🎉 You WON $${amount}!\nWallet: $${user.wallet + amount}` }, { quoted: m })
    } else {
      updateUser(sender, { wallet: user.wallet - amount })
      await sock.sendMessage(jid, { text: `💀 You LOST $${amount}!\nWallet: $${user.wallet - amount}` }, { quoted: m })
    }
  }
}
