const fs = require('fs')
const path = require('path')
const { SHOP } = require('./shop')
module.exports = {
  name: 'inventory',
  alias: ['inv', 'bag'],
  category: 'economy',
  react: '🎒',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || jid
    const invPath = path.join(__dirname, '../../database/inventory.json')
    if (!fs.existsSync(invPath)) return sock.sendMessage(jid, { text: `🎒 Inventory empty` }, { quoted: m })
    
    const invDB = JSON.parse(fs.readFileSync(invPath))
    const items = invDB[sender] || []
    if (!items.length) return sock.sendMessage(jid, { text: `🎒 Your inventory is empty. Use .shop` }, { quoted: m })

    let count = {}
    items.forEach(i => count[i] = (count[i]||0)+1)
    let text = `╭━━〔 🎒 *INVENTORY* 〕━━╮\n┃ 👤 @${sender.split('@')[0]}\n┃\n`
    for (let id in count) {
      const item = SHOP.find(s => s.id === id)
      text += `┃ ${item ? item.name : id} x${count[id]}\n`
    }
    text += `╰━━━━━━━━━━━━━━━━╯`
    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m })
  }
}
