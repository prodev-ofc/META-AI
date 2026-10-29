const { getUser, updateUser } = require('../utils/economy')
const fs = require('fs')
const path = require('path')
module.exports = {
  name: 'rob',
  alias: ['steal'],
  category: 'economy',
  react: '🔪',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const senderUser = getUser(sender)
    const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    
    if (!target) return sock.sendMessage(jid, { text: `Usage: .rob @user` }, { quoted: m })
    if (target === sender) return sock.sendMessage(jid, { text: `😂 You can't rob yourself` }, { quoted: m })
    
    const targetUser = getUser(target)
    if (targetUser.wallet < 100) return sock.sendMessage(jid, { text: `❌ That user is broke (<$100)` }, { quoted: m })

    // Need gun?
    const invPath = path.join(__dirname, '../../database/inventory.json')
    const invDB = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath)) : {}
    const hasGun = invDB[sender]?.includes('gun')
    if (!hasGun) return sock.sendMessage(jid, { text: `❌ You need 🔫 Gun to rob. Buy with .buy gun` }, { quoted: m })

    const now = Date.now()
    if (now - (senderUser.lastRob || 0) < 600000) { // 10 min cooldown
      return sock.sendMessage(jid, { text: `⏳ Rob cooldown 10 mins` }, { quoted: m })
    }

    const success = Math.random() > 0.4
    if (!success) {
      const fine = Math.floor(Math.random() * 200) + 100
      updateUser(sender, { wallet: Math.max(0, senderUser.wallet - fine), lastRob: now })
      return sock.sendMessage(jid, { text: `🚨 You failed and got caught! Lost $${fine}` }, { quoted: m })
    }

    const stolen = Math.floor(targetUser.wallet * 0.3) // steal 30%
    updateUser(sender, { wallet: senderUser.wallet + stolen, lastRob: now })
    updateUser(target, { wallet: targetUser.wallet - stolen })

    await sock.sendMessage(jid, {
      text: `🔪 @${sender.split('@')[0]} robbed $${stolen} from @${target.split('@')[0]}!`,
      mentions: [sender, target]
    }, { quoted: m })
  }
}
