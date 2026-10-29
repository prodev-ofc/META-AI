const { getUser, updateUser } = require('../utils/economy')
module.exports = {
  name: 'slots',
  alias: ['slot', 'spin'],
  category: 'economy',
  react: '🎰',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const user = getUser(sender)
    const bet = parseInt(args[0]) || 100
    if (user.wallet < bet) return sock.sendMessage(jid, { text: `❌ Need $${bet}` }, { quoted: m })

    const emojis = ["🍒", "🍋", "🍊", "💎", "7️⃣", "🔔"]
    const a = emojis[Math.floor(Math.random()*emojis.length)]
    const b = emojis[Math.floor(Math.random()*emojis.length)]
    const c = emojis[Math.floor(Math.random()*emojis.length)]

    let win = 0
    if (a === b && b === c) win = bet * 3
    else if (a === b || b === c || a === c) win = bet * 1.5

    if (win > 0) {
      updateUser(sender, { wallet: user.wallet + win })
      await sock.sendMessage(jid, { text: `🎰 [ ${a} | ${b} | ${c} ]\n🎉 WIN $${win}!\nWallet: $${user.wallet + win}` }, { quoted: m })
    } else {
      updateUser(sender, { wallet: user.wallet - bet })
      await sock.sendMessage(jid, { text: `🎰 [ ${a} | ${b} | ${c} ]\n💀 LOST $${bet}\nWallet: $${user.wallet - bet}` }, { quoted: m })
    }
  }
}
