// meta/react.js
module.exports = {
  name: 'react',
  react: '❤️',
  alias: ['chreact', 'creact'],
  category: 'meta',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const start = Date.now()

    try {
      // Usage: .react 10 <link> 🙌,🤣,💯
      // args = ['10', 'https://...', '🙌,🤣,💯']
      let count = parseInt(args[0]) || 10
      let link = args[1]
      let emojiStr = args.slice(2).join(' ')

      if (!link) {
        return await sock.sendMessage(jid, {
          text: '❌ *Wrong format*\n\nUse:\n.react 10 <link> 🙌,🤣,💯,💙,💓,🙏,❤️,❤️‍🔥,🔥,💖\n\nExample:\n.react 10 https://whatsapp.com/channel/0029VadWc2LDJ6H0Rg6DjO30/732 🙌,🤣,💯'
        }, { quoted: m })
      }

      // Max 10 - your 10 reactions
      if (count > 10) count = 10
      if (count < 1) count = 1

      let emojis = emojiStr.split(',').map(e => e.trim()).filter(Boolean)
      if (!emojis.length) emojis = ['🙌','🤣','💯','💙','💓','🙏','❤️','❤️‍🔥','🔥','💖']

      // If user gave less than 10, cycle them to make 10
      while (emojis.length < count) emojis = [...emojis, ...emojis]
      emojis = emojis.slice(0, count)

      const matchLink = link.match(/channel\/([^\/]+)\/(\d+)/)
      if (!matchLink) {
        return await sock.sendMessage(jid, { text: '❌ Invalid channel link' }, { quoted: m })
      }

      const inviteCode = matchLink[1]

      await sock.sendMessage(jid, {
        text: `⏳ Reacting ${count}x...\n> _Getting channel ${inviteCode}_`
      }, { quoted: m })

      // Get real channel JID from invite code
      const metadata = await sock.newsletterMetadata('invite', inviteCode)
      const channelJid = metadata.id

      let messageId = matchLink[2]
      try {
        const msgs = await sock.newsletterFetchMessages(channelJid, 1)
        if (msgs?.[0]?.key?.id) messageId = msgs[0].key.id
      } catch {}

      for (let i = 0; i < count; i++) {
        await sock.newsletterReactMessage(channelJid, messageId, emojis[i])
        await new Promise(r => setTimeout(r, 1200))
      }

      await sock.sendMessage(jid, {
        text:
          '╭━━━〔 ❤️ *CHANNEL REACT* 〕━━━╮\n' +
          '┃\n' +
          `┃ ✅ *Done:* ${count} reactions added\n` +
          `┃ 😍 *Emojis:* ${emojis.join(' ')}\n` +
          `┃ ⚡ *Time:* ${Date.now() - start} ms\n` +
          '┃ 🛡️ *Developer:* PRODEV ZW\n' +
          '┃\n' +
          '╰━━━━━━━━━━━━━━━━━━━━╯'
      }, { quoted: m })

    } catch (error) {
      console.error('react.js error:', error)
      await sock.sendMessage(jid, { text: '❌ Error: ' + error.message }, { quoted: m })
    }
  }
}
