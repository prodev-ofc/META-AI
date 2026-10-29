const fs = require('fs')
const path = require('path')
const { getUser, updateUser } = require('../utils/economy')

const borrowPath = path.join(__dirname, '../database/borrow.json')
if (!fs.existsSync(path.dirname(borrowPath))) fs.mkdirSync(path.dirname(borrowPath), { recursive: true })
if (!fs.existsSync(borrowPath)) fs.writeFileSync(borrowPath, '{}')

function getBorrows(){ return JSON.parse(fs.readFileSync(borrowPath)) }
function saveBorrows(d){ fs.writeFileSync(borrowPath, JSON.stringify(d, null, 2)) }

module.exports = {
  name: 'borrow',
  alias: ['request', 'approve', 'give'],
  category: 'economy',
  react: '🤝',
  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const sender = m.key.participant || m.participant || jid
    const senderUser = getUser(sender)
    const borrows = getBorrows()

    const firstArg = (args[0] || '').toLowerCase()
    const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    const quotedUser = m.message.extendedTextMessage?.contextInfo?.participant

    // === APPROVE / GIVE ===
    // Usage: .borrow approve @user 500  OR  reply to borrow request with "approve 500" or "give 500"
    if (['approve', 'give', 'accept', 'yes'].includes(firstArg)) {
      const target = mentioned || quotedUser
      const amount = parseInt(args[1] || args[2] || args[0].replace(/\D/g, ''))
      
      if (!target) return sock.sendMessage(jid, { text: `Usage: .borrow approve @user 500` }, { quoted: m })
      if (!amount) return sock.sendMessage(jid, { text: `Set amount: .borrow approve @user 500` }, { quoted: m })

      // Check if there's a pending request from target
      const pending = borrows[target]
      if (!pending || pending.to !== sender) {
        // Still allow direct give without request
      }

      const lender = getUser(sender)
      if (lender.wallet < amount) return sock.sendMessage(jid, { text: `❌ You have $${lender.wallet}, need $${amount} to give` }, { quoted: m })

      // Transfer
      const borrower = getUser(target)
      updateUser(sender, { wallet: lender.wallet - amount })
      updateUser(target, { wallet: borrower.wallet + amount })

      // Clear request
      if (borrows[target]) delete borrows[target]
      saveBorrows(borrows)

      return sock.sendMessage(jid, {
        text: `✅ *LOAN APPROVED*\n\n🤝 @${sender.split('@')[0]} gave $${amount} to @${target.split('@')[0]}\n\n💸 Lender now: $${lender.wallet - amount}\n💰 Borrower now: $${borrower.wallet + amount}`,
        mentions: [sender, target]
      }, { quoted: m })
    }

    // === REQUEST BORROW ===
    // Usage: .borrow @user 500
    const amount = parseInt(args[1] || args[0])
    const target = mentioned

    if (!target || !amount) {
      return sock.sendMessage(jid, { text: `Usage:\n.borrow @user 500 - Request\n.borrow approve @user 500 - Approve\n\nOr reply to request with: approve 500 / give 500` }, { quoted: m })
    }
    if (target === sender) return sock.sendMessage(jid, { text: `😂 Can't borrow from yourself` }, { quoted: m })
    if (amount <= 0 || amount > 1000) return sock.sendMessage(jid, { text: `❌ Amount must be 1-1000` }, { quoted: m })

    // Save request
    borrows[sender] = { to: target, amount, time: Date.now() }
    saveBorrows(borrows)

    await sock.sendMessage(jid, {
      text: `🤝 *BORROW REQUEST*\n\n👤 @${sender.split('@')[0]} wants to borrow $${amount} from @${target.split('@')[0]}\n\n@${target.split('@')[0]} reply with:\n• .borrow approve @${sender.split('@')[0]} ${amount}\n• or just type: approve ${amount} / give ${amount}`,
      mentions: [sender, target]
    }, { quoted: m })

    // Also DM the target if group
    try {
      await sock.sendMessage(target, {
        text: `🔔 @${sender.split('@')[0]} is asking you for $${amount} in ${jid.includes('@g.us') ? 'group' : 'chat'}\n\nApprove with: .borrow approve @${sender.split('@')[0]} ${amount}`
      })
    } catch {}
  }
}
