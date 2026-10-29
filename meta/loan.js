const fs = require('fs')
const path = require('path')
const { getUser, updateUser } = require('../utils/economy')

const loanPath = path.join(__dirname, '../database/loans.json')
if (!fs.existsSync(path.dirname(loanPath))) fs.mkdirSync(path.dirname(loanPath), { recursive: true })
if (!fs.existsSync(loanPath)) fs.writeFileSync(loanPath, '{}')

function getLoans(){ return JSON.parse(fs.readFileSync(loanPath)) }
function saveLoans(d){ fs.writeFileSync(loanPath, JSON.stringify(d, null, 2)) }

module.exports = {
  name: 'loan',
  alias: ['bankloan', 'loans'],
  category: 'economy',
  react: '🏦',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const user = getUser(sender)
    const loans = getLoans()
    const myLoan = loans[sender] || 0

    const action = (args[0] || '').toLowerCase()
    
    // .loan info
    if (action === 'info' || !args[0]) {
      return sock.sendMessage(jid, { 
        text: `╭━━〔 🏦 *BANK LOAN* 〕━━╮\n┃\n┃ 💰 Your Loan: $${myLoan} / $1000 max\n┃ 💵 Wallet: $${user.wallet}\n┃\n┃ 📌 .loan 500 - Borrow\n┃ 📌 .loan pay 500 - Repay\n┃ 📌 .loan info - Check\n╰━━━━━━━━━━━━━━━━╯` 
      }, { quoted: m })
    }

    // .loan pay 500
    if (action === 'pay') {
      const amount = parseInt(args[1])
      if (!amount || amount <= 0) return sock.sendMessage(jid, { text: `Usage: .loan pay 500` }, { quoted: m })
      if (myLoan <= 0) return sock.sendMessage(jid, { text: `✅ You have no loan to pay` }, { quoted: m })
      if (user.wallet < amount) return sock.sendMessage(jid, { text: `❌ Need $${amount}, you have $${user.wallet}` }, { quoted: m })
      
      const pay = Math.min(amount, myLoan)
      loans[sender] = myLoan - pay
      saveLoans(loans)
      updateUser(sender, { wallet: user.wallet - pay })
      return sock.sendMessage(jid, { text: `✅ Paid $${pay} loan\nRemaining loan: $${loans[sender]}` }, { quoted: m })
    }

    // .loan 500
    const amount = parseInt(action)
    if (!amount || amount <= 0) return sock.sendMessage(jid, { text: `Usage: .loan 500` }, { quoted: m })
    if (amount > 1000) return sock.sendMessage(jid, { text: `❌ Max loan is $1000` }, { quoted: m })
    if (myLoan + amount > 1000) return sock.sendMessage(jid, { text: `❌ You already have $${myLoan}, you can only borrow $${1000 - myLoan} more` }, { quoted: m })

    loans[sender] = myLoan + amount
    saveLoans(loans)
    updateUser(sender, { wallet: user.wallet + amount })

    await sock.sendMessage(jid, { 
      text: `🏦 *LOAN APPROVED*\n\n💰 Borrowed: $${amount}\n📊 Total Loan: $${loans[sender]} / $1000\n💵 Wallet: $${user.wallet + amount}\n\nRepay with .loan pay ${amount}` 
    }, { quoted: m })
  }
}
