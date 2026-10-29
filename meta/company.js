const fs = require('fs')
const path = require('path')
const { getUser, updateUser } = require('../utils/economy')

const companyPath = path.join(__dirname, '../database/company.json')
if (!fs.existsSync(path.dirname(companyPath))) fs.mkdirSync(path.dirname(companyPath), { recursive: true })
if (!fs.existsSync(companyPath)) fs.writeFileSync(companyPath, JSON.stringify({ treasury: 0, investors: {}, totalInvested: 0, level: 1 }, null, 2))

function getCompany(){ return JSON.parse(fs.readFileSync(companyPath)) }
function saveCompany(d){ fs.writeFileSync(companyPath, JSON.stringify(d, null, 2)) }

module.exports = {
  name: 'company',
  alias: ['corp','business','comp'],
  category: 'economy',
  react: '🏢',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)
    
    // Bot number = owner
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net' || sock.user?.id
    const botClean = botNumber.replace(/[^0-9]/g, '')
    const isBotOwner = sender === botNumber || sender.includes(botClean) || m.isBotOwner || false
    
    let company = getCompany()
    const action = (args[0] || '').toLowerCase()
    const now = Date.now()

    // === .company (stats) ===
    if (!action || action === 'info' || action === 'stats') {
      const myInv = company.investors[sender]
      let myText = 'No active investment'
      if (myInv) {
        const left = myInv.end - now
        if (left > 0) myText = `$${myInv.amount} → $${myInv.amount + myInv.profit} in ${Math.ceil(left/60000)}m`
        else myText = `READY TO COLLECT $${myInv.amount + myInv.profit}`
      }
      
      return sock.sendMessage(jid, {
        text: `╭━━━〘 🏢 *BOT COMPANY* 〙━━━╮\n┃\n┃ 👑 Owner: Bot (${botClean})\n┃ 💰 Treasury: $${company.treasury}\n┃ 📊 Total Invested: $${company.totalInvested}\n┃ 🏆 Level: ${company.level}\n┃ 👥 Investors: ${Object.keys(company.investors).length}\n┃\n┃ 💼 Your Invest: ${myText}\n┃ 💵 Your Wallet: $${user.wallet}\n┃\n┃ 📌 .company invest 500\n┃ 📌 .company collect\n┃ 📌 .company leaderboard\n┃ ${isBotOwner ? '📌 .company withdraw 100 (owner)' : ''}\n╰━━━━━━━━━━━━━━━━━━━━━╯`
      }, { quoted: m })
    }

    // === .company invest 500 ===
    if (action === 'invest') {
      const amount = parseInt(args[1])
      if (!amount) return sock.sendMessage(jid, { text: `Usage: .company invest 500\nMin $100 Max $5000` }, { quoted: m })
      if (amount < 100 || amount > 5000) return sock.sendMessage(jid, { text: `❌ Min $100 Max $5000` }, { quoted: m })
      if (user.wallet < amount) return sock.sendMessage(jid, { text: `❌ Wallet $${user.wallet} need $${amount}` }, { quoted: m })
      if (company.investors[sender]) return sock.sendMessage(jid, { text: `⏳ You already have $${company.investors[sender].amount} invested. Collect first` }, { quoted: m })

      const profit = Math.floor(amount * 0.4) // 40% profit from company
      company.investors[sender] = { amount, profit, end: now + 15*60*1000, start: now } // 15 min
      company.treasury += amount
      company.totalInvested += amount
      saveCompany(company)
      updateUser(sender, { wallet: user.wallet - amount })

      return sock.sendMessage(jid, { text: `🏢 *INVESTED IN BOT COMPANY*\n\n💰 Amount: $${amount}\n📈 Return: $${amount + profit} (Profit $${profit})\n⏳ Time: 15 minutes\n🏦 Company Treasury: $${company.treasury}\n\nCollect with .company collect after 15m` }, { quoted: m })
    }

    // === .company collect ===
    if (action === 'collect') {
      const inv = company.investors[sender]
      if (!inv) return sock.sendMessage(jid, { text: `❌ No investment. Use .company invest 500` }, { quoted: m })
      
      const left = inv.end - now
      if (left > 0) {
        return sock.sendMessage(jid, { text: `⏳ Not ready. Wait ${Math.ceil(left/60000)} minutes\nReturn: $${inv.amount + inv.profit}` }, { quoted: m })
      }

      // Check treasury can pay
      if (company.treasury < inv.profit) {
        return sock.sendMessage(jid, { text: `⚠️ Company treasury low ($${company.treasury}), can't pay profit yet. Bot owner must fund it.\nContact owner.` }, { quoted: m })
      }

      company.treasury -= inv.profit // only profit comes from treasury, principal already there
      delete company.investors[sender]
      saveCompany(company)
      updateUser(sender, { wallet: user.wallet + inv.amount + inv.profit })

      return sock.sendMessage(jid, { text: `✅ *COLLECTED FROM COMPANY*\n\n💰 Got: $${inv.amount + inv.profit}\n💵 Profit: $${inv.profit}\n💼 Wallet: $${user.wallet + inv.amount + inv.profit}\n🏦 Treasury left: $${company.treasury}` }, { quoted: m })
    }

    // === .company leaderboard ===
    if (action === 'lb' || action === 'leaderboard' || action === 'top') {
      const top = Object.entries(company.investors).map(([id, d]) => ({ id, ...d })).sort((a,b) => b.amount - a.amount).slice(0,10)
      let txt = `🏆 *COMPANY TOP INVESTORS*\n\n`
      if (top.length === 0) txt += 'No active investors'
      else top.forEach((u,i) => txt += `${i+1}. @${u.id.split('@')[0]} - $${u.amount} → $${u.amount+u.profit}\n`)
      return sock.sendMessage(jid, { text: txt, mentions: top.map(u => u.id) }, { quoted: m })
    }

    // === .company withdraw (OWNER ONLY = BOT) ===
    if (action === 'withdraw' || action === 'take') {
      if (!isBotOwner && !m.isOwner) return sock.sendMessage(jid, { text: `❌ Only Bot Owner can withdraw treasury` }, { quoted: m })
      const amount = parseInt(args[1])
      if (!amount || amount <=0) return sock.sendMessage(jid, { text: `Usage: .company withdraw 100` }, { quoted: m })
      if (company.treasury < amount) return sock.sendMessage(jid, { text: `❌ Treasury $${company.treasury} only` }, { quoted: m })
      company.treasury -= amount
      saveCompany(company)
      updateUser(sender, { wallet: user.wallet + amount })
      return sock.sendMessage(jid, { text: `🏦 Owner withdrew $${amount}\nTreasury: $${company.treasury}\nWallet: $${user.wallet + amount}` }, { quoted: m })
    }

    // === .company fund (owner adds money to treasury) ===
    if (action === 'fund' || action === 'add') {
      if (!isBotOwner && !m.isOwner) return sock.sendMessage(jid, { text: `❌ Only owner can fund` }, { quoted: m })
      const amount = parseInt(args[1])
      if (!amount || user.wallet < amount) return sock.sendMessage(jid, { text: `Need amount + enough wallet` }, { quoted: m })
      company.treasury += amount
      saveCompany(company)
      updateUser(sender, { wallet: user.wallet - amount })
      return sock.sendMessage(jid, { text: `✅ Funded company with $${amount}\nTreasury: $${company.treasury}` }, { quoted: m })
    }
  }
}
