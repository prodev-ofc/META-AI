const { getUser, updateUser } = require('../utils/economy')
module.exports = {
  name: 'deposit',
  alias: ['dep','depo'],
  category: 'economy',
  react: '🏦',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)
    const amount = args[0]?.toLowerCase() === 'all' ? user.wallet : parseInt(args[0])
    if (!amount || amount <= 0) return sock.sendMessage(jid, { text: `❌ .deposit 100 or .deposit all` }, { quoted: m })
    if (user.wallet < amount) return sock.sendMessage(jid, { text: `❌ Wallet $${user.wallet} only` }, { quoted: m })
    updateUser(sender, { wallet: user.wallet - amount, bank: user.bank + amount })
    await sock.sendMessage(jid, { text: `✅ Deposited $${amount}\n🏦 Bank: $${user.bank + amount}\n💵 Wallet: $${user.wallet - amount}` }, { quoted: m })
  }
}
