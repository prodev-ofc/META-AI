const { getUser, updateUser } = require('../utils/economy')
const jobs = ["ProDev coder", "Taxi driver", "Farmer", "YouTuber", "Miner", "Teacher", "Gweru hustler"]
module.exports = {
  name: 'work',
  alias: ['job'],
  category: 'economy',
  react: '💼',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const user = getUser(sender)
    const now = Date.now()
    const cooldown = 5 * 60 * 1000 // 5 min

    if (now - user.lastWork < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastWork)) / 1000)
      return sock.sendMessage(jid, { text: `⏳ Rest! Try again in ${left}s` }, { quoted: m })
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)]
    const earn = Math.floor(Math.random() * 200) + 50
    updateUser(sender, { wallet: user.wallet + earn, lastWork: now })

    await sock.sendMessage(jid, {
      text: `💼 You worked as *${job}* and earned $${earn}!\n💰 Wallet: $${user.wallet + earn}`
    }, { quoted: m })
  }
}
