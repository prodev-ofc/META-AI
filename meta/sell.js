const fs = require('fs')
const path = require('path')
const { getUser, updateUser } = require('../utils/economy')
const { SHOP } = require('./shop')

module.exports = {
  name: 'sell',
  alias: ['sellitem'],
  category: 'economy',
  react: '💸',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const id = (args[0] || '').toLowerCase()
    
    if (!id) return sock.sendMessage(jid, { text: `Usage: .sell <id>\nEx: .sell diamond\nUse .inventory to see your items` }, { quoted: m })

    const invPath = path.join(__dirname, '../database/inventory.json')
    if (!fs.existsSync(invPath)) return sock.sendMessage(jid, { text: `🎒 You have nothing to sell` }, { quoted: m })
    
    const invDB = JSON.parse(fs.readFileSync(invPath))
    let items = invDB[sender] || []
    
    if (!items.includes(id)) {
      return sock.sendMessage(jid, { text: `❌ You don't own ${id}\nCheck .inventory` }, { quoted: m })
    }

    const shopItem = SHOP.find(i => i.id === id)
    if (!shopItem) return sock.sendMessage(jid, { text: `❌ Can't sell this item` }, { quoted: m })

    // Sell price = 75% of buy price, except diamond = $20000 profit
    let sellPrice = Math.floor(shopItem.price * 0.75)
    if (id === 'diamond') sellPrice = 20000
    if (id === 'house') sellPrice = 40000
    if (id === 'car') sellPrice = 8000

    // Remove 1 item
    const index = items.indexOf(id)
    items.splice(index, 1)
    invDB[sender] = items
    fs.writeFileSync(invPath, JSON.stringify(invDB, null, 2))

    // Add money
    const user = getUser(sender)
    updateUser(sender, { wallet: user.wallet + sellPrice })

    await sock.sendMessage(jid, { 
      text: `✅ Sold ${shopItem.name} for $${sellPrice}!\n💰 Wallet: $${user.wallet + sellPrice}` 
    }, { quoted: m })
  }
}
