const Photo360 = require('abir-photo360-apis');

module.exports = {
  name: 'goldlogo',
  react: '🥇',
  alias: ['gold', 'goldenlogo'],
  category: 'tools',

  async execute(sock, m, args) {
    const jid = m.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      return sock.sendMessage(jid, {
        text: '🥇 *GOLD LOGO*\n\nUsage: .goldlogo Your Name'
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, {
        text: '🥇 Creating your golden logo...'
      }, { quoted: m });

      const generator = new Photo360(
        'https://en.ephoto360.com/'
      );

      generator.setName(text);
      const result = await generator.execute();

      if (!result?.status || !result?.imageUrl) {
        throw new Error('No image was returned.');
      }

      await sock.sendMessage(jid, {
        image: { url: result.imageUrl },
        caption: `🥇 *GOLD LOGO*\n\n✍️ Text: ${text}\n\n> PRODEV OFFICIALS`
      }, { quoted: m });

    } catch (error) {
      console.error('goldlogo.js error:', error);

      await sock.sendMessage(jid, {
        text: '❌ Gold logo generation failed. Please try again.'
      }, { quoted: m });
    }
  }
};
