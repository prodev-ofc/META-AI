const { getUser } = require('../utils/economy')
module.exports = {
  name: 'wallet',
  alias: ['wal','purse'],
  category: 'economy',
  react: '👛',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)
    await sock.sendMessage(jid, { text: `👛 *WALLET*\n\n💵 Cash: $${user.wallet}\n🏦 Bank: $${user.bank}\n\nUse .deposit 100 to save` }, { quoted: m })
  }
}
