const Photo360 = require('abir-photo360-apis');

module.exports = {
  name: 'logo',
  react: '🎨',
  alias: ['ephoto', 'photo360', 'textlogo'],
  category: 'tools',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input) {
      return sock.sendMessage(jid, {
        text:
          '╭━━〔 🎨 *PHOTO 360 LOGO* 〕━━╮\n' +
          '┃\n' +
          '┃ Create a stylish text effect.\n' +
          '┃\n' +
          '┃ *Usage:*\n' +
          '┃ .logo Your Name\n' +
          '┃\n' +
          '┃ *Custom effect:*\n' +
          '┃ .logo https://en.ephoto360.com/effect-page.html | Your Name\n' +
          '┃\n' +
          '╰━━━━━━━━━━━━━━━━━━━━╯'
      }, { quoted: m });
    }

    let effectUrl =
      'https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html';

    let text = input;

    const separator = input.indexOf('|');

    if (separator !== -1) {
      effectUrl = input.slice(0, separator).trim();
      text = input.slice(separator + 1).trim();
    }

    if (!text) {
      return sock.sendMessage(jid, {
        text: '❌ Please provide the text for your logo.'
      }, { quoted: m });
    }

    if (!effectUrl.startsWith('https://') ||
        !effectUrl.includes('ephoto360.com/')) {
      return sock.sendMessage(jid, {
        text: '❌ Please provide a valid HTTPS Ephoto 360 effect URL.'
      }, { quoted: m });
    }

    await sock.sendMessage(jid, {
      text: '🎨 Generating your logo... Please wait.'
    }, { quoted: m });

    try {
      const generator = new Photo360(effectUrl);
      generator.setName(text);

      const result = await generator.execute();

      if (!result || !result.status || !result.imageUrl) {
        throw new Error('The effect did not return a generated image.');
      }

      await sock.sendMessage(jid, {
        image: { url: result.imageUrl },
        caption:
          '╭━━〔 🎨 *PHOTO 360 LOGO* 〕━━╮\n' +
          '┃\n' +
          `┃ ✍️ *Text:* ${text}\n` +
          '┃ ✅ *Status:* Generated\n' +
          '┃\n' +
          '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
          '> *Powered by PRODEV OFFICIALS*'
      }, { quoted: m });

    } catch (error) {
      console.error('logo.js error:', error);

      await sock.sendMessage(jid, {
        text:
          '❌ Logo generation failed.\n\n' +
          'The effect page may be unavailable or may require a different input format. Please try again later.'
      }, { quoted: m });
    }
  }
};
