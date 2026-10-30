const fs = require('fs')
const path = require('path')

const ECO_PATH = path.join(__dirname, '../database/economy.json')
const COOLDOWN = 60 * 1000 // 1 min

function loadEco(){
  try{
    if(!fs.existsSync(path.dirname(ECO_PATH))) fs.mkdirSync(path.dirname(ECO_PATH), { recursive: true })
    if(!fs.existsSync(ECO_PATH)) fs.writeFileSync(ECO_PATH, '{}')
    return JSON.parse(fs.readFileSync(ECO_PATH))
  }catch{ return {} }
}
function saveEco(d){ fs.writeFileSync(ECO_PATH, JSON.stringify(d, null, 2)) }

const HUSTLES = [
  { text: "💼 You worked as a waiter and earned", min: 50, max: 120 },
  { text: "📦 You delivered packages and earned", min: 70, max: 150 },
  { text: "🚕 You drove taxi all day and earned", min: 80, max: 180 },
  { text: "🧹 You cleaned houses and earned", min: 40, max: 100 },
  { text: "💻 You freelanced online and earned", min: 100, max: 250 },
  { text: "🎤 You sang in streets and earned", min: 30, max: 200 },
  { text: "🍔 You flipped burgers and earned", min: 60, max: 140 },
  { text: "📸 You sold photos and earned", min: 90, max: 220 },
  { text: "🔧 You fixed phones and earned", min: 110, max: 300 },
  { text: "💃 You danced at event and earned", min: 150, max: 400 },
  { text: "🦹 You robbed a bank but cops took cut, you got", min: 200, max: 600, risk: true },
]

module.exports = {
  name: "hustle",
  alias: ["work2","grind","job"],
  category: "economy",
  react: "💪",
  desc: "Hustle for money",

  async execute(sock, m, args){
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const id = sender

    const eco = loadEco()
    if(!eco[id]) eco[id] = { wallet: 0, bank: 0, lastHustle: 0 }

    const now = Date.now()
    const last = eco[id].lastHustle || 0
    const diff = now - last

    if(diff < COOLDOWN){
      const left = Math.ceil((COOLDOWN - diff)/1000)
      return await sock.sendMessage(jid, { text: `⏳ You are exhausted! Rest for *${left}s* before hustling again` }, { quoted: m })
    }

    const job = HUSTLES[Math.floor(Math.random()*HUSTLES.length)]
    let reward = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min

    // Risk job can fail
    if(job.risk && Math.random() < 0.25){
      eco[id].lastHustle = now
      saveEco(eco)
      return await sock.sendMessage(jid, { text: `🚨 *HUSTLE FAILED*\n\nYou tried to ${job.text.toLowerCase()} but got caught!\nYou paid $50 fine 💸\n\nWallet: $${Math.max(0, eco[id].wallet - 50)}` }, { quoted: m })
    }

    eco[id].wallet += reward
    eco[id].lastHustle = now
    saveEco(eco)

    await sock.sendMessage(jid, { 
      text: `💪 *HUSTLE*\n\n${job.text} *$${reward}*\n\n💼 Wallet: $${eco[id].wallet}\n🏦 Bank: $${eco[id].bank}\n\n_Next hustle in 1 min_` 
    }, { quoted: m })
  }
}
