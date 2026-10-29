
// meta/add.js
// Simulated group-member notices + real member addition by number.

const WATERMARK = '> _👥 Group Tools by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝐟𝐟𝐢𝐜𝐢𝐚𝐥𝐬_'

module.exports = {
  name: 'add',
  react: '👥',
  alias: ['addmember', 'fakeadd'],
  category: 'group',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid

    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: `❌ Use this command inside a WhatsApp group.\n\n${WATERMARK}`
      }, { quoted: m })
    }

    const input = (args[0] || '').trim()

    if (!input) {
      return sock.sendMessage(jid, {
        text:
          '*╭┈───〔 👥 ADD TOOL 〕┈───⊷*\n' +
          '│ .add 5 — simulate 5 members\n' +
          '│ .add 10 — simulate 10 members\n' +
          '│ .add 29 — simulate 29 members\n' +
          '│ .add 263771234567 — request a real addition\n' +
          '*╰───────────────────⊷*\n\n' +
          '_Count-only notices are simulated; no members are added._\n\n' +
          WATERMARK
      }, { quoted: m })
    }

    // Count-only mode: simulate a notice without changing the group.
    if (/^\d+$/.test(input) && input.length <= 3) {
      const count = Number(input)

      if (count < 1 || count > 100) {
        return sock.sendMessage(jid, {
          text: `⚠️ Choose a simulated count from 1 to 100.\n\n${WATERMARK}`
        }, { quoted: m })
      }

      return sock.sendMessage(jid, {
        text:
          '*🧪 SIMULATED GROUP EVENT*\n\n' +
          `👥 ${count} fictional member${count === 1 ? '' : 's'} ${count === 1 ? 'was' : 'were'} added in this demonstration.\n` +
          '🔗 Invite-link join: simulated only\n' +
          '✅ Real group membership changed: 0\n\n' +
          '_This is a test notice, not an actual WhatsApp system notification._\n\n' +
          WATERMARK
      }, { quoted: m })
    }

    // Real-number mode.
    const number = input.replace(/\D/g, '')

    if (number.length < 7 || number.length > 15) {
      return sock.sendMessage(jid, {
        text: `❌ Enter a valid international phone number or a count from 1 to 100.\n\n${WATERMARK}`
      }, { quoted: m })
    }

    try {
      const metadata = await sock.groupMetadata(jid)
      const botJid = sock.user?.id?.split(':')[0]
      const botParticipant = metadata.participants.find(p =>
        (p.id || '').split(':')[0] === botJid
      )

      if (!botParticipant?.admin && !botParticipant?.superadmin) {
        return sock.sendMessage(jid, {
          text: `❌ The bot must be a group admin to attempt adding a member.\n\n${WATERMARK}`
        }, { quoted: m })
      }

      const targetJid = `${number}@s.whatsapp.net`

      const result = await sock.groupParticipantsUpdate(
        jid,
        [targetJid],
        'add'
      )

      const status = result?.[0]?.status

      let text

      if (status === '200') {
        text = `✅ WhatsApp accepted the request to add +${number}.`
      } else if (status === '403') {
        text = `ℹ️ WhatsApp may require an invitation for +${number}.`
      } else {
        text = `ℹ️ WhatsApp returned status ${status || 'unknown'} for +${number}.`
      }

      return sock.sendMessage(jid, {
        text: `${text}\n\n${WATERMARK}`
      }, { quoted: m })

    } catch (error) {
      console.error('add.js error:', error)

      return sock.sendMessage(jid, {
        text:
          '❌ WhatsApp could not complete the addition. The person may need an invite link, or group permissions may prevent it.\n\n' +
          WATERMARK
      }, { quoted: m })
    }
  }
}
