const { getUser, updateUser } = require('../utils/economy')
const { SHOP } = require('./shop')
const fs = require('fs')
const path = require('path')

module.exports = {
  name: 'buy',
  category: 'economy',
  react: '🛍️',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const user = getUser(sender)
    const id = (args[0] || '').toLowerCase()
    
    const item = SHOP.find(i => i.id === id)
    if (!id || !item) return sock.sendMessage(jid, { text: `❌ Item not found. Use .shop\nEx: .buy laptop` }, { quoted: m })
    if (user.wallet < item.price) return sock.sendMessage(jid, { text: `❌ You need $${item.price}, you have $${user.wallet}` }, { quoted: m })

    // Deduct
    updateUser(sender, { wallet: user.wallet - item.price })

    // Add to inventory
    const invPath = path.join(__dirname, '../../database/inventory.json')
    if (!fs.existsSync(path.dirname(invPath))) fs.mkdirSync(path.dirname(invPath), { recursive: true })
    if (!fs.existsSync(invPath)) fs.writeFileSync(invPath, '{}')
    const invDB = JSON.parse(fs.readFileSync(invPath))
    if (!invDB[sender]) invDB[sender] = []
    invDB[sender].push(item.id)
    fs.writeFileSync(invPath, JSON.stringify(invDB, null, 2))

    await sock.sendMessage(jid, { text: `✅ You bought ${item.name} for $${item.price}!\nUse .inventory to see it` }, { quoted: m })
  }
}
