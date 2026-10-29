const fs = require('fs')
const path = require('path')
const { getUser, updateUser } = require('../utils/economy')

const investPath = path.join(__dirname, '../database/invest.json')
if (!fs.existsSync(path.dirname(investPath))) fs.mkdirSync(path.dirname(investPath), { recursive: true })
if (!fs.existsSync(investPath)) fs.writeFileSync(investPath, '{}')

module.exports = {
  name: 'invest',
  alias: ['investment'],
  category: 'economy',
  react: '📈',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)
    let invests = JSON.parse(fs.readFileSync(investPath))
    const now = Date.now()

    // Check if has active invest
    if (invests[sender]) {
      const timeLeft = invests[sender].end - now
      if (timeLeft > 0) {
        const mins = Math.ceil(timeLeft / 60000)
        return sock.sendMessage(jid, { text: `⏳ Investment running: $${invests[sender].amount}\nReturn in ${mins} min with $${invests[sender].profit} profit\n\nUse .invest collect after time` }, { quoted: m })
      } else {
        // Collect
        if ((args[0] || '').toLowerCase() === 'collect') {
          const profit = invests[sender].profit
          const total = invests[sender].amount + profit
          updateUser(sender, { wallet: user.wallet + total })
          delete invests[sender]
          fs.writeFileSync(investPath, JSON.stringify(invests, null, 2))
          return sock.sendMessage(jid, { text: `✅ Collected $${total}!\n💰 Invest: $${total - profit} + Profit $${profit}\nWallet: $${user.wallet + total}` }, { quoted: m })
        } else {
          return sock.sendMessage(jid, { text: `💹 Your investment matured!\nType .invest collect to get $${invests[sender].amount + invests[sender].profit}` }, { quoted: m })
        }
      }
    }

    const amount = parseInt(args[0])
    if (!amount) return sock.sendMessage(jid, { text: `📈 *INVEST*\n\n.invest 500 - invest $500 for 10 min (30% profit)\n.invest collect - collect after time\n\nMin $100, Max $5000` }, { quoted: m })
    if (amount < 100 || amount > 5000) return sock.sendMessage(jid, { text: `❌ Min $100, Max $5000` }, { quoted: m })
    if (user.wallet < amount) return sock.sendMessage(jid, { text: `❌ Wallet $${user.wallet}, need $${amount}` }, { quoted: m })

    const profit = Math.floor(amount * 0.3) // 30%
    invests[sender] = { amount, profit, end: now + 10*60*1000 } // 10 mins
    fs.writeFileSync(investPath, JSON.stringify(invests, null, 2))
    updateUser(sender, { wallet: user.wallet - amount })

    await sock.sendMessage(jid, { text: `📈 Invested $${amount}\n⏳ Wait 10 minutes\n💰 Return: $${amount + profit} ($${profit} profit)\n\nType .invest collect after 10 min` }, { quoted: m })
  }
}
