const { getUser, updateUser } = require('../utils/economy')
module.exports = {
  name: 'pay',
  alias: ['transfer', 'give'],
  category: 'economy',
  react: '💸',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const senderUser = getUser(sender)

    const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    const amount = parseInt(args[1] || args[0])
    
    if (!mentioned || !amount) return sock.sendMessage(jid, { text: `Usage: .pay @user 100` }, { quoted: m })
    if (senderUser.wallet < amount) return sock.sendMessage(jid, { text: `❌ Not enough money` }, { quoted: m })

    const receiverUser = getUser(mentioned)
    updateUser(sender, { wallet: senderUser.wallet - amount })
    updateUser(mentioned, { wallet: receiverUser.wallet + amount })

    await sock.sendMessage(jid, {
      text: `💸 @${sender.split('@')[0]} paid $${amount} to @${mentioned.split('@')[0]}`,
      mentions: [sender, mentioned]
    }, { quoted: m })
  }
}
