const { getUser, updateUser } = require('../utils/economy')
const fs = require('fs')
const path = require('path')

const cooldownPath = path.join(__dirname, '../database/mine.json')
if (!fs.existsSync(path.dirname(cooldownPath))) fs.mkdirSync(path.dirname(cooldownPath), { recursive: true })
if (!fs.existsSync(cooldownPath)) fs.writeFileSync(cooldownPath, '{}')

module.exports = {
  name: 'mine',
  alias: ['mining', 'miner'],
  category: 'economy',
  react: '⛏️',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)

    let cooldowns = JSON.parse(fs.readFileSync(cooldownPath))
    const now = Date.now()
    const last = cooldowns[sender] || 0
    const COOLDOWN = 3 * 60 * 1000 // 3 minutes

    if (now - last < COOLDOWN) {
      const left = Math.ceil((COOLDOWN - (now - last)) / 1000)
      return sock.sendMessage(jid, { text: `⛏️ Pickaxe cooling down! Wait ${left}s` }, { quoted: m })
    }

    // Random rewards
    const r = Math.random()
    let reward, text

    if (r < 0.02) { // 2% diamond
      reward = 1500
      text = `💎 *JACKPOT!* You found a DIAMOND!\n+ $${reward}`
    } else if (r < 0.15) { // 13% gold
      reward = Math.floor(Math.random() * 400) + 300 // 300-700
      text = `🥇 You found Gold!\n+ $${reward}`
    } else if (r < 0.4) { // 25% silver
      reward = Math.floor(Math.random() * 200) + 150 // 150-350
      text = `🥈 You found Silver!\n+ $${reward}`
    } else if (r < 0.7) { // 30% iron
      reward = Math.floor(Math.random() * 100) + 80 // 80-180
      text = `⛓️ You found Iron!\n+ $${reward}`
    } else { // 30% stone/coal
      reward = Math.floor(Math.random() * 60) + 20 // 20-80
      text = `🪨 You found Coal/Stone\n+ $${reward}`
    }

    // Give money
    updateUser(sender, { wallet: user.wallet + reward })
    cooldowns[sender] = now
    fs.writeFileSync(cooldownPath, JSON.stringify(cooldowns, null, 2))

    await sock.sendMessage(jid, {
      text: `⛏️ *MINING*\n\n${text}\n💰 Wallet: $${user.wallet + reward}\n\nNext mine in 3 min`
    }, { quoted: m })
  }
}
