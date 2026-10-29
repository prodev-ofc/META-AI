module.exports = {
  name: 'alive',
  react: '💚',
  alias: ['status', 'online'],
  category: 'tools',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const start = Date.now()

    try {
      await sock.sendMessage(jid, {
        text:
          '╭━━━〔 💚 *META AI* 〕━━━╮\n' +
          '┃\n' +
          '┃ ✅ *Status:* Online and active\n' +
          '┃ 🤖 *System:* WhatsApp Bot\n' +
          `┃ ⚡ *Response:* ${Date.now() - start} ms\n` +
          '┃ 🛡️ *Developer:* PRODEV ZW\n' +
          '┃\n' +
          '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
          '> _Your bot is alive and ready to serve!_'
      }, { quoted: m })

    } catch (error) {
      console.error('alive.js error:', error)
    }
  }
}
