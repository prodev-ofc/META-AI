const { getUser, updateUser } = require('../utils/economy')

module.exports = {
  name: 'withdraw',
  alias: ['with', 'wd'],
  category: 'economy',
  react: '💸',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)

    let amount = args[0]
    if (!amount) return sock.sendMessage(jid, { text: `❌ Usage: .withdraw 100\nOr .withdraw all` }, { quoted: m })

    if (amount.toLowerCase() === 'all') amount = user.bank
    else amount = parseInt(amount)

    if (!amount || amount <= 0) return sock.sendMessage(jid, { text: `❌ Enter valid amount\nEx: .withdraw 500` }, { quoted: m })
    if (user.bank < amount) return sock.sendMessage(jid, { text: `❌ Bank has $${user.bank} only, you tried $${amount}` }, { quoted: m })

    updateUser(sender, { wallet: user.wallet + amount, bank: user.bank - amount })

    await sock.sendMessage(jid, { 
      text: `✅ Withdrew $${amount} from bank\n\n💵 Wallet: $${user.wallet + amount}\n🏦 Bank: $${user.bank - amount}` 
    }, { quoted: m })
  }
}
