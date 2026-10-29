const { getUser } = require('../utils/economy')
module.exports = {
  name: 'balance',
  alias: ['bal', 'wallet', 'money'],
  category: 'economy',
  react: '💰',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)
    const total = user.wallet + user.bank

    await sock.sendMessage(jid, {
      text: `╭━━〔 💰 *ECONOMY* 〕━━╮\n┃\n┃ 👤 *User:* @${sender.split('@')[0]}\n┃ 💵 *Wallet:* $${user.wallet}\n┃ 🏦 *Bank:* $${user.bank}\n┃ 💎 *Total:* $${total}\n┃\n╰━━━━━━━━━━━━━━━━╯`,
      mentions: [sender]
    }, { quoted: m })
  }
}
