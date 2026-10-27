const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function downloadMedia(bufferMsg) {
  try {
    // Method 1: Baileys downloadContentFromMessage
    const type = Object.keys(bufferMsg)[0]; // imageMessage etc
    const msgObj = bufferMsg[type];
    const stream = await downloadContentFromMessage(msgObj, type.replace('Message',''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  } catch (e) {
    console.log("downloadContentFromMessage failed", e.message);
    return null;
  }
}

module.exports = {
  name: "url",
  alias: ["tourl", "upload", "catbox", "geturl"],
  category: "tools",
  desc: "Upload image/video/audio to url",
  async execute(sock, m, args, { WATERMARK }) {
    const jid = m.key.remoteJid;
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = quoted || m.message;

    const getMedia = () => {
      if (msg.imageMessage) return { type: 'image', mimetype: msg.imageMessage.mimetype, raw: msg };
      if (msg.videoMessage) return { type: 'video', mimetype: msg.videoMessage.mimetype, raw: msg };
      if (msg.audioMessage) return { type: 'audio', mimetype: msg.audioMessage.mimetype, raw: msg };
      if (msg.documentMessage) return { type: 'document', mimetype: msg.documentMessage.mimetype, raw: msg };
      if (msg.stickerMessage) return { type: 'sticker', mimetype: 'image/webp', raw: msg };
      return null;
    };

    const media = getMedia();
    if (!media) {
      return sock.sendMessage(jid, { text: `*🔗 URL UPLOADER*\n\nReply to an image, video, audio or document with:\n\n*.url*\n\nSupports: jpg, png, mp4, mp3, webp, pdf\n${WATERMARK}` }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: "⏳", key: m.key } });

      // Download buffer using Baileys helper
      let buffer = null;

      // Try method 1: your m may have download
      if (m.download) {
        try { buffer = await m.download(); } catch {}
      }
      // Try method 2: sock.downloadMediaMessage if exists
      if (!buffer && sock.downloadMediaMessage) {
        try {
          buffer = await sock.downloadMediaMessage({ message: media.raw });
        } catch {}
      }
      // Try method 3: downloadContentFromMessage
      if (!buffer) {
        buffer = await downloadMedia(media.raw);
      }

      if (!buffer) throw new Error("Failed to download - try sending image with caption .url");

      let ext = "jpg";
      if (media.mimetype) {
        const parts = media.mimetype.split('/');
        if (parts[1]) ext = parts[1].split(';')[0].replace('jpeg','jpg').replace('mpeg','mp3');
      }
      if (ext.length > 5) ext = "mp4";
      const filename = `upload_${Date.now()}.${ext}`;

      const uploadToCatbox = async () => {
        const form = new FormData();
        const blob = new Blob([buffer], { type: media.mimetype || 'application/octet-stream' });
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', blob, filename);
        const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
        const text = await res.text();
        if (text.startsWith('https://')) return text.trim();
        throw new Error(text);
      };

      const uploadTo0x0 = async () => {
        const form = new FormData();
        const blob = new Blob([buffer], { type: media.mimetype || 'application/octet-stream' });
        form.append('file', blob, filename);
        const res = await fetch('https://0x0.st', { method: 'POST', body: form });
        return (await res.text()).trim();
      };

      let url = '', host = 'catbox.moe';
      try { url = await uploadToCatbox(); }
      catch(e) {
        url = await uploadTo0x0();
        host = '0x0.st';
      }

      const sizeKB = (buffer.length/1024).toFixed(2);
      const sizeText = buffer.length > 1024*1024 ? `${(buffer.length/(1024*1024)).toFixed(2)} MB` : `${sizeKB} KB`;

      const result = `╭───「 *🔗 UPLOADED* 」───
│ 📁 Type: ${media.type} (${media.mimetype})
│ 📦 Size: ${sizeText}
│ 🌐 Host: ${host}
│ 
│ 🔗 *URL:*
│ ${url}
╰─────────────────
${WATERMARK}`;

      await sock.sendMessage(jid, { text: result }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });

    } catch (e) {
      console.log('url.js error:', e);
      await sock.sendMessage(jid, { text: `❌ Upload failed: ${e.message}` }, { quoted: m });
    }
  }
};
