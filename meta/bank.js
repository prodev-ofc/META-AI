
const { getUser, updateUser } = require('../utils/economy')

module.exports = {
  name: 'bank',
  alias: ['deposit', 'withdraw', 'dep', 'with'],
  category: 'economy',
  react: '🏦',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)
    
    // Get command name safely (works on your base)
    const body = m.body || m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || ""
    const cmd = body.split(' ')[0].replace(/^[.\/!]/, '').toLowerCase()
    const amount = parseInt(args[0])

    // deposit
    if (['deposit','dep'].includes(cmd)) {
      if (!amount || amount <= 0) return sock.sendMessage(jid, { text: `❌ Use .deposit 100` }, { quoted: m })
      if (user.wallet < amount) return sock.sendMessage(jid, { text: `❌ Wallet $${user.wallet}, need $${amount}` }, { quoted: m })
      updateUser(sender, { wallet: user.wallet - amount, bank: user.bank + amount })
      return sock.sendMessage(jid, { text: `🏦 Deposited $${amount} to bank\nBank: $${user.bank + amount}` }, { quoted: m })
    }

    // withdraw
    if (['withdraw','with'].includes(cmd)) {
      if (!amount || amount <= 0) return sock.sendMessage(jid, { text: `❌ Use .withdraw 100` }, { quoted: m })
      if (user.bank < amount) return sock.sendMessage(jid, { text: `❌ Bank $${user.bank}, need $${amount}` }, { quoted: m })
      updateUser(sender, { wallet: user.wallet + amount, bank: user.bank - amount })
      return sock.sendMessage(jid, { text: `🏦 Withdrew $${amount}\nWallet: $${user.wallet + amount}` }, { quoted: m })
    }

    // .bank info
    await sock.sendMessage(jid, {
      text: `🏦 *BANK*\n\n💵 Wallet: $${user.wallet}\n🏦 Bank: $${user.bank}\n💎 Total: $${user.wallet + user.bank}\n\n.deposit 100\n.withdraw 100`
    }, { quoted: m })
  }
}
