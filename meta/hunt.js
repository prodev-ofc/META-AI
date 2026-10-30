const fs = require('fs')
const path = require('path')

const ECO_PATH = path.join(__dirname, '../database/economy.json')
const COOLDOWN = 30 * 1000 // 30 sec

function loadEco(){
  try{
    if(!fs.existsSync(path.dirname(ECO_PATH))) fs.mkdirSync(path.dirname(ECO_PATH), { recursive: true })
    if(!fs.existsSync(ECO_PATH)) fs.writeFileSync(ECO_PATH, '{}')
    return JSON.parse(fs.readFileSync(ECO_PATH))
  }catch{ return {} }
}
function saveEco(d){ fs.writeFileSync(ECO_PATH, JSON.stringify(d, null, 2)) }

const ANIMALS = [
  { name: "🐰 Rabbit", min: 10, max: 50, rare: 50 },
  { name: "🦊 Fox", min: 40, max: 90, rare: 30 },
  { name: "🦌 Deer", min: 80, max: 150, rare: 20 },
  { name: "🐻 Bear", min: 120, max: 250, rare: 12 },
  { name: "🐯 Tiger", min: 200, max: 400, rare: 8 },
  { name: "🦁 Lion", min: 300, max: 600, rare: 5 },
  { name: "🐉 Dragon", min: 800, max: 1500, rare: 1 },
]

module.exports = {
  name: "hunt",
  alias: ["hunting","shikar"],
  category: "economy",
  react: "🏹",
  desc: "Hunt animals for money",

  async execute(sock, m, args){
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const id = sender

    const eco = loadEco()
    if(!eco[id]) eco[id] = { wallet: 0, bank: 0, lastHunt: 0, inventory: {} }

    const now = Date.now()
    const last = eco[id].lastHunt || 0
    const diff = now - last

    if(diff < COOLDOWN){
      const left = Math.ceil((COOLDOWN - diff)/1000)
      return await sock.sendMessage(jid, { text: `⏳ You are tired! Hunt again in *${left}s*\nBuy hunting rifle with .shop to reduce cooldown` }, { quoted: m })
    }

    // Roll animal based on rarity
    const roll = Math.random()*100
    let chosen = ANIMALS[0]
    let totalRare = 0
    // Sort by rare descending for roll logic
    const sorted = [...ANIMALS].sort((a,b)=> b.rare - a.rare)
    for(let a of sorted){
      totalRare += a.rare
      if(roll <= totalRare){ chosen = a; break }
    }
    // If roll high, give rare
    if(roll > 85) chosen = ANIMALS[Math.floor(Math.random()*3)+4] // rare ones
    else chosen = ANIMALS[Math.floor(Math.random()*4)] // common

    // 10% miss
    if(Math.random() < 0.10){
      eco[id].lastHunt = now
      saveEco(eco)
      return await sock.sendMessage(jid, { text: `🏹 *HUNT FAILED*\n\nYou went hunting but found nothing...\nThe forest was empty 🌲\n\nTry again in 30s` }, { quoted: m })
    }

    const reward = Math.floor(Math.random() * (chosen.max - chosen.min + 1)) + chosen.min
    eco[id].wallet += reward
    eco[id].lastHunt = now
    if(!eco[id].inventory[chosen.name]) eco[id].inventory[chosen.name] = 0
    eco[id].inventory[chosen.name]++

    saveEco(eco)

    const texts = [
      `🏹 *HUNT SUCCESS!*\n\nYou tracked for hours and found ${chosen.name}!\n\n💰 Reward: $${reward}\n💼 Wallet: $${eco[id].wallet}\n\n_Hint: Rare animals = more money_`,
      `🔫 *BANG!* You got ${chosen.name}\n\n💵 Sold for $${reward}\nWallet: $${eco[id].wallet}`,
      `🌲 You entered deep forest...\nCaught ${chosen.name}!\n\n+ $${reward} added`
    ]
    const cap = texts[Math.floor(Math.random()*texts.length)]

    await sock.sendMessage(jid, { text: cap }, { quoted: m })
  }
}
