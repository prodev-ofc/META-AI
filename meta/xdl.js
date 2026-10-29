const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFile } = require('child_process')
const { promisify } = require('util')

const execFileAsync = promisify(execFile)

const MAX_SIZE = 45 * 1024 * 1024

module.exports = {
  name: 'xdl',
  react: '🔞',
  alias: ['xxx', 'xvid', 'xxxvid', 'porn', '18'],
  category: 'adult',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const input = args[0]

    if (!input) {
      return sock.sendMessage(jid, {
        text:
          '*🔞 XDL VIDEO DOWNLOADER*\n\n' +
          'Usage: .xdl <video-link>\n\n' +
          'Aliases: .xxx, .xvid, .xxxvid, .porn, .18\n\n' +
          'Supported sites depend on yt-dlp.'
      }, { quoted: m })
    }

    let url

    try {
      url = new URL(input)
    } catch {
      return sock.sendMessage(jid, {
        text: '❌ Please provide a valid video URL.'
      }, { quoted: m })
    }

    if (!['https:', 'http:'].includes(url.protocol)) {
      return sock.sendMessage(jid, {
        text: '❌ Only HTTP and HTTPS links are accepted.'
      }, { quoted: m })
    }

    if (
      url.hostname === 'localhost' ||
      url.hostname.endsWith('.localhost') ||
      url.hostname.endsWith('.local') ||
      !url.hostname.includes('.')
    ) {
      return sock.sendMessage(jid, {
        text: '❌ This host is not supported.'
      }, { quoted: m })
    }

    const workDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'abc-xdl-')
    )

    const output = path.join(workDir, 'video.%(ext)s')
    const file = path.join(workDir, 'video.mp4')

    try {
      await sock.sendMessage(jid, {
        text: '⏳ Downloading video… Please wait.'
      }, { quoted: m })

      await execFileAsync('yt-dlp', [
        '--no-playlist',
        '--no-warnings',
        '--max-filesize', '45M',
        '--format', 'best[ext=mp4][filesize<45M]/best[filesize<45M]',
        '--merge-output-format', 'mp4',
        '--output', output,
        '--socket-timeout', '20',
        '--retries', '2',
        '--',
        url.href
      ], {
        timeout: 180000,
        maxBuffer: 2 * 1024 * 1024
      })

      if (!fs.existsSync(file)) {
        throw new Error(
          'No MP4 output was created. This source may need another format.'
        )
      }

      const stat = fs.statSync(file)

      if (stat.size === 0 || stat.size > MAX_SIZE) {
        throw new Error('The downloaded video is empty or too large.')
      }

      await sock.sendMessage(jid, {
        video: fs.readFileSync(file),
        mimetype: 'video/mp4',
        caption: '🔞 *XDL DOWNLOADER*\n\n> Downloaded by PRODEV OFFICIALS'
      }, { quoted: m })

    } catch (error) {
      console.error('xdl.js error:', error.stderr || error.message)

      await sock.sendMessage(jid, {
        text:
          '❌ Download failed.\n\n' +
          'The link may be unsupported, restricted, or too large.'
      }, { quoted: m })

    } finally {
      fs.rmSync(workDir, {
        recursive: true,
        force: true
      })
    }
  }
}
