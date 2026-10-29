const fs = require('fs')
const path = require('path')

const DATA_FILE = path.join(__dirname, '..', 'temp', 'channel-simulation.json')
const WATERMARK = '> _📢 Channel Simulator by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝐟𝐟𝐢𝐜𝐢𝐚𝐥𝐬_'

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return { channels: {}, messages: {} }
  }
}

function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function parseCount(value) {
  const match = String(value || '').toLowerCase().match(/^(\d+(?:\.\d+)?)(k)?$/)
  if (!match) return null

  const count = Number(match[1]) * (match[2] ? 1000 : 1)

  if (!Number.isSafeInteger(count) || count < 0) return null
  return count
}

function formatCount(count) {
  return Number(count).toLocaleString('en-US')
}

function validLink(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

module.exports = {
  name: 'channel',
  react: '📢',
  alias: ['chstats', 'chsim'],
  category: 'tools',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid

    try {
      const action = (args[0] || 'help').toLowerCase()
      const data = loadData()

      if (action === 'help') {
        return sock.sendMessage(jid, {
          text:
            '*╭┈───〔 📢 CHANNEL SIMULATOR 〕┈───⊷*\n' +
            '*├• Followers:*\n' +
            '│ .channel followers <link> +10\n' +
            '│ .channel followers <link> 1k\n' +
            '│ .channel followers <link>\n\n' +
            '*├• Reactions:*\n' +
            '│ .channel react <message-link> +10\n' +
            '│ .channel react <message-link> 25\n\n' +
            '*├• Other:*\n' +
            '│ .channel stats <link>\n' +
            '│ .channel clear <link>\n' +
            '*╰──────────────────────⊷*\n\n' +
            '_Simulation data only; real WhatsApp statistics are unchanged._\n\n' +
            WATERMARK
        }, { quoted: m })
      }

      if (action === 'followers') {
        const link = args[1]
        const value = args[2]

        if (!link || !validLink(link)) {
          return sock.sendMessage(jid, {
            text: `❌ Provide a valid channel URL.\nExample: .channel followers https://example.com/channel +10\n\n${WATERMARK}`
          }, { quoted: m })
        }

        if (!data.channels[link]) {
          data.channels[link] = { followers: 0 }
        }

        const current = data.channels[link].followers

        if (value === undefined) {
          return sock.sendMessage(jid, {
            text: `📢 *SIMULATED CHANNEL FOLLOWERS*\n\nCurrent total: ${formatCount(current)}\n\n_This is local test data, not the real channel count._\n\n${WATERMARK}`
          }, { quoted: m })
        }

        let next

        if (value.startsWith('+')) {
          const increment = parseCount(value.slice(1))

          if (increment === null) {
            return sock.sendMessage(jid, {
              text: `❌ Invalid amount. Try +7, +29, +500 or +1k.\n\n${WATERMARK}`
            }, { quoted: m })
          }

          next = current + increment
        } else {
          next = parseCount(value)

          if (next === null) {
            return sock.sendMessage(jid, {
              text: `❌ Invalid total. Try 1, 29, 500, 1k or 2k.\n\n${WATERMARK}`
            }, { quoted: m })
          }
        }

        data.channels[link].followers = next
        saveData(data)

        return sock.sendMessage(jid, {
          text:
            '*📢 SIMULATED FOLLOWER TOTAL UPDATED*\n\n' +
            `Previous: ${formatCount(current)}\n` +
            `New simulated total: ${formatCount(next)}\n\n` +
            '_No real channel followers were added._\n\n' +
            WATERMARK
        }, { quoted: m })
      }

      if (action === 'react') {
        const link = args[1]
        const value = args[2]

        if (!link || !validLink(link)) {
          return sock.sendMessage(jid, {
            text: `❌ Provide a valid message URL.\n\n${WATERMARK}`
          }, { quoted: m })
        }

        if (!data.messages[link]) {
          data.messages[link] = { reactions: 0 }
        }

        const current = data.messages[link].reactions

        if (value === undefined) {
          return sock.sendMessage(jid, {
            text: `🧪 *SIMULATED REACTIONS*\nCurrent total: ${formatCount(current)}\n\n_No real reactions were sent._\n\n${WATERMARK}`
          }, { quoted: m })
        }

        let next

        if (value.startsWith('+')) {
          const increment = parseCount(value.slice(1))

          if (increment === null) {
            return sock.sendMessage(jid, {
              text: `❌ Invalid amount. Example: +10 or +26.\n\n${WATERMARK}`
            }, { quoted: m })
          }

          next = current + increment
        } else {
          next = parseCount(value)

          if (next === null) {
            return sock.sendMessage(jid, {
              text: `❌ Invalid total. Example: 10 or 25.\n\n${WATERMARK}`
            }, { quoted: m })
          }
        }

        data.messages[link].reactions = next
        saveData(data)

        return sock.sendMessage(jid, {
          text:
            '*🧪 SIMULATED REACTIONS UPDATED*\n\n' +
            `Previous: ${formatCount(current)}\n` +
            `New simulated total: ${formatCount(next)}\n\n` +
            '_No real WhatsApp reactions were sent._\n\n' +
            WATERMARK
        }, { quoted: m })
      }

      if (action === 'stats') {
        const link = args[1]

        if (!link || !validLink(link)) {
          return sock.sendMessage(jid, {
            text: `❌ Provide a channel URL.\n\n${WATERMARK}`
          }, { quoted: m })
        }

        const followers = data.channels[link]?.followers || 0

        return sock.sendMessage(jid, {
          text:
            '*📊 SIMULATED CHANNEL STATS*\n\n' +
            `Followers: ${formatCount(followers)}\n\n` +
            '_These are local test values, not verified WhatsApp statistics._\n\n' +
            WATERMARK
        }, { quoted: m })
      }

      if (action === 'clear') {
        const link = args[1]

        if (!link || !validLink(link)) {
          return sock.sendMessage(jid, {
            text: `❌ Provide the channel URL to clear its simulation.\n\n${WATERMARK}`
          }, { quoted: m })
        }

        delete data.channels[link]
        saveData(data)

        return sock.sendMessage(jid, {
          text: `✅ Simulated follower data cleared. Real channel unchanged.\n\n${WATERMARK}`
        }, { quoted: m })
      }

      return sock.sendMessage(jid, {
        text: `❌ Unknown option. Use .channel help\n\n${WATERMARK}`
      }, { quoted: m })

    } catch (error) {
      console.error('channel.js error:', error)

      return sock.sendMessage(jid, {
        text: `❌ Channel simulator failed. Check the terminal logs.\n\n${WATERMARK}`
      }, { quoted: m })
    }
  }
}
