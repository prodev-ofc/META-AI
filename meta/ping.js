module.exports = {
  name: "ping",
  react: "🏓",
  category: "main",
  alias: ["speed", "p"],
  desc: "Check bot speed",
  execute: async (sock, m, args, { WATERMARK }) => {
    await sock.sendMessage(m.key.remoteJid, { react: { text: "🏓", key: m.key } });

    const start = Date.now();

    const quotedMessage = {
      key: {
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'xpro-tech',
        participant: '13135550002@s.whatsapp.net'
      },
      message: {
        locationMessage: {
          degreesLatitude: -6.200000,
          degreesLongitude: 106.816666,
          name: '𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖',
          address: '𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖',
          jpegThumbnail: null
        }
      }
    };

    const latency = Date.now() - start;

    await sock.sendMessage(m.key.remoteJid, {
      text: `🏓 Pong! ${latency}ms ⚡\n\n${WATERMARK}`
    }, { quoted: quotedMessage });
  }
}
