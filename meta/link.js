module.exports = {
  name: 'link',
  react: '🔗',
  alias: ['grouplink', 'glink', 'gclink', 'linkgc'],
  category: 'group',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid

    // multi react function
    const multiReact = async (emojis) => {
      for (let e of emojis) {
        await sock.sendMessage(jid, {
          react: { text: e, key: m.key }
        })
        await new Promise(r => setTimeout(r, 350))
      }
    }

    try {
      if (!jid.endsWith('@g.us')) {
        await multiReact(['❌'])
        return sock.sendMessage(jid, {
          text: '❌ This command only works in WhatsApp groups.'
        }, { quoted: m })
      }

      // Start reactions
      await multiReact(['🔗', '👥'])

      const metadata = await sock.groupMetadata(jid)
      const inviteCode = await sock.groupInviteCode(jid)

      if (!inviteCode) {
        await multiReact(['❌'])
        return sock.sendMessage(jid, {
          text: '❌ Could not retrieve the group invite link.'
        }, { quoted: m })
      }

      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`

      await sock.sendMessage(jid, {
        text:
          '╭━━〔 🔗 *GROUP INVITE LINK* 〕━━╮\n' +
          '┃\n' +
          `┃ 👥 *Group:* ${metadata.subject || 'Unknown'}\n` +
          '┃\n' +
          `┃ 🔗 *Link:*\n${inviteLink}\n` +
          '┃\n' +
          '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
          '> _Share responsibly._'
      }, { quoted: m })

      // Final success react - will stay
      await sock.sendMessage(jid, {
        react: { text: '✅', key: m.key }
      })

    } catch (error) {
      console.error('link.js error:', error)
      await multiReact(['❌', '⚠️'])

      await sock.sendMessage(jid, {
        text:
          '❌ Could not get the group link.\n' +
          'Make sure the bot has permission to access the group invite link.'
      }, { quoted: m })
    }
  }
}
