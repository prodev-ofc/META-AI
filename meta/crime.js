const { getUser, updateUser } = require('../utils/economy')
const crimes = [
  "robbed a bank", "hacked ProDev wallet", "stole a car", "sold weed", "scammed a mzungu"
]
module.exports = {
  name: 'crime',
  category: 'economy',
  react: '🦹',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const user = getUser(sender)
    const now = Date.now()
    if (now - (user.lastCrime || 0) < 120000) return sock.sendMessage(jid, { text: `⏳ Wait 2 mins to do crime again` }, { quoted: m })

    const crime = crimes[Math.floor(Math.random()*crimes.length)]
    const success = Math.random() > 0.35
    if (success) {
      const earn = Math.floor(Math.random()*500)+100
      updateUser(sender, { wallet: user.wallet + earn, lastCrime: now })
      await sock.sendMessage(jid, { text: `🦹 You ${crime} and earned $${earn}!` }, { quoted: m })
    } else {
      const lost = Math.floor(Math.random()*200)+50
      updateUser(sender, { wallet: Math.max(0, user.wallet - lost), lastCrime: now })
      await sock.sendMessage(jid, { text: `🚔 You got caught doing crime! Lost $${lost}` }, { quoted: m })
    }
  }
}
