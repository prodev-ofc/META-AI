const SHOP = [
  { id: 'laptop', name: '💻 Laptop', price: 2000, desc: 'Work 2x faster' },
  { id: 'car', name: '🚗 Car', price: 10000, desc: 'Flex status' },
  { id: 'house', name: '🏠 House', price: 50000, desc: 'Rich man' },
  { id: 'gun', name: '🔫 Gun', price: 1500, desc: 'Needed for rob' },
  { id: 'mask', name: '🎭 Mask', price: 800, desc: 'Avoid rob fail' },
  { id: 'diamond', name: '💎 Diamond', price: 15000, desc: 'Sell for $20000' },
]

module.exports = {
  name: 'shop',
  alias: ['store'],
  category: 'economy',
  react: '🛒',
  async execute(sock, m) {
    const jid = m.key.remoteJid
    let text = `╭━━〔 🛒 *SHOP* 〕━━╮\n┃\n`
    SHOP.forEach(item => {
      text += `┃ ${item.name} - $${item.price}\n┃   ID: ${item.id} | ${item.desc}\n┃\n`
    })
    text += `┃ Use: .buy <id>\n╰━━━━━━━━━━━━━━━━╯`
    await sock.sendMessage(jid, { text }, { quoted: m })
  }
}
module.exports.SHOP = SHOP // export for buy.js
