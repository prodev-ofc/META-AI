const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB
const TIMEOUT = 120000; // 2 minutes

function unwrapMessage(message) {
  if (!message) return null;

  let current = message;

  // Unwrap common WhatsApp message wrappers
  for (let i = 0; i < 5; i++) {
    if (
      current.ephemeralMessage?.message ||
      current.viewOnceMessage?.message ||
      current.viewOnceMessageV2?.message ||
      current.documentWithCaptionMessage?.message
    ) {
      current =
        current.ephemeralMessage?.message ||
        current.viewOnceMessage?.message ||
        current.viewOnceMessageV2?.message ||
        current.documentWithCaptionMessage?.message;
    } else {
      break;
    }
  }

  return current;
}

function detectMedia(message) {
  const msg = unwrapMessage(message);
  if (!msg) return null;

  const mediaTypes = {
    imageMessage: 'image',
    videoMessage: 'video',
    audioMessage: 'audio',
    documentMessage: 'document',
    stickerMessage: 'sticker'
  };

  for (const [key, type] of Object.entries(mediaTypes)) {
    if (msg[key]) {
      const content = msg[key];

      return {
        type,
        downloadType: type === 'sticker' ? 'image' : type,
        mimetype:
          content.mimetype ||
          (type === 'sticker' ? 'image/webp' : 'application/octet-stream'),
        content,
        raw: msg
      };
    }
  }

  return null;
}

async function downloadMedia(media) {
  // Method 1: Baileys native stream downloader
  try {
    const stream = await downloadContentFromMessage(
      media.content,
      media.downloadType
    );

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);

      const total = chunks.reduce((sum, item) => sum + item.length, 0);

      if (total > MAX_SIZE) {
        throw new Error('File exceeds the 200 MB upload limit.');
      }
    }

    const buffer = Buffer.concat(chunks);

    if (buffer.length) return buffer;
  } catch (error) {
    if (error.message.includes('200 MB')) throw error;
    console.log('[META-AI URL] Baileys download failed:', error.message);
  }

  return null;
}

function getExtension(mimetype, type) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/opus': 'opus',
    'audio/wav': 'wav',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/octet-stream': 'bin'
  };

  if (map[mimetype]) return map[mimetype];

  const ext = mimetype?.split('/')[1]?.split(';')[0];

  if (ext && /^[a-z0-9]{1,8}$/i.test(ext)) {
    return ext.replace('jpeg', 'jpg');
  }

  return type === 'sticker' ? 'webp' : 'bin';
}

async function uploadToCatbox(buffer, filename, mimetype) {
  const form = new FormData();

  form.append('reqtype', 'fileupload');
  form.append(
    'fileToUpload',
    new Blob([buffer], { type: mimetype }),
    filename
  );

  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(TIMEOUT)
  });

  const result = (await response.text()).trim();

  if (!response.ok || !/^https:\/\/files\.catbox\.moe\//i.test(result)) {
    throw new Error(result || `Catbox HTTP ${response.status}`);
  }

  return result;
}

async function uploadTo0x0(buffer, filename, mimetype) {
  const form = new FormData();

  form.append(
    'file',
    new Blob([buffer], { type: mimetype }),
    filename
  );

  const response = await fetch('https://0x0.st', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(TIMEOUT)
  });

  const result = (await response.text()).trim();

  if (!response.ok || !/^https?:\/\/0x0\.st\//i.test(result)) {
    throw new Error(result || `0x0.st HTTP ${response.status}`);
  }

  return result;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / 1024).toFixed(2)} KB`;
}

module.exports = {
  name: 'url',
  alias: ['tourl', 'upload', 'catbox', 'geturl'],
  category: 'tools',
  desc: 'Upload media and files to a public URL',

  async execute(sock, m, args, { WATERMARK }) {
    const jid = m.key.remoteJid;

    const message = unwrapMessage(m.message);

    const quoted =
      message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      message?.imageMessage?.contextInfo?.quotedMessage ||
      message?.videoMessage?.contextInfo?.quotedMessage ||
      message?.documentMessage?.contextInfo?.quotedMessage ||
      message?.stickerMessage?.contextInfo?.quotedMessage;

    const target = quoted || m.message;
    const media = detectMedia(target);

    if (!media) {
      return sock.sendMessage(
        jid,
        {
          text:
            `╭━━〔 *META-AI URL UPLOADER* 〕━━╮\n` +
            `│\n` +
            `│ 📎 *How to upload*\n` +
            `│\n` +
            `│ • Reply to media with *.url*\n` +
            `│ • Send media with *.url* caption\n` +
            `│ • Alias: *.tourl*\n` +
            `│\n` +
            `│ 📦 Images, videos, audio,\n` +
            `│ documents and stickers\n` +
            `│\n` +
            `│ 🌐 Hosts: Catbox / 0x0.st\n` +
            `│ 📏 Max size: 200 MB\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
            `${WATERMARK || ''}`
        },
        { quoted: m }
      );
    }

    try {
      await sock.sendMessage(jid, {
        react: { text: '⏳', key: m.key }
      });

      await sock.sendMessage(
        jid,
        { text: '⏳ *META-AI is processing your file...*' },
        { quoted: m }
      );

      let buffer = null;

      // Method 1: native media downloader
      buffer = await downloadMedia(media);

      // Method 2: message-level downloader if supported by your bot
      if (!buffer && typeof m.download === 'function') {
        try {
          const downloaded = await m.download();

          if (Buffer.isBuffer(downloaded)) {
            buffer = downloaded;
          } else if (downloaded instanceof Uint8Array) {
            buffer = Buffer.from(downloaded);
          }
        } catch (error) {
          console.log('[META-AI URL] m.download failed:', error.message);
        }
      }

      if (!buffer || !buffer.length) {
        throw new Error(
          'Could not download media. Try sending the file again or reply to it with .url'
        );
      }

      if (buffer.length > MAX_SIZE) {
        throw new Error('File exceeds the maximum upload size of 200 MB.');
      }

      const mimetype = media.mimetype || 'application/octet-stream';
      const extension = getExtension(mimetype, media.type);
      const filename = `META-AI_${Date.now()}.${extension}`;

      let url;
      let host;

      // Primary host
      try {
        url = await uploadToCatbox(buffer, filename, mimetype);
        host = 'Catbox';
      } catch (catboxError) {
        console.log('[META-AI URL] Catbox failed:', catboxError.message);

        // Fallback host
        url = await uploadTo0x0(buffer, filename, mimetype);
        host = '0x0.st';
      }

      const result =
        `╭━━〔 *META-AI UPLOADER* 〕━━╮\n` +
        `│\n` +
        `│ ✅ *UPLOAD SUCCESSFUL*\n` +
        `│\n` +
        `│ 📁 *Type:* ${media.type}\n` +
        `│ 🧾 *Format:* ${mimetype}\n` +
        `│ 📦 *Size:* ${formatSize(buffer.length)}\n` +
        `│ 🌐 *Host:* ${host}\n` +
        `│\n` +
        `│ 🔗 *YOUR URL*\n` +
        `│ ${url}\n` +
        `│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
        `${WATERMARK || ''}`;

      await sock.sendMessage(
        jid,
        { text: result },
        { quoted: m }
      );

      await sock.sendMessage(jid, {
        react: { text: '✅', key: m.key }
      });

    } catch (error) {
      console.error('[META-AI URL ERROR]', error);

      await sock.sendMessage(
        jid,
        {
          text:
            `╭━━〔 *META-AI UPLOADER* 〕━━╮\n` +
            `│\n` +
            `│ ❌ *UPLOAD FAILED*\n` +
            `│\n` +
            `│ ${error.message || 'Unknown error'}\n` +
            `│\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
            `${WATERMARK || ''}`
        },
        { quoted: m }
      );

      await sock.sendMessage(jid, {
        react: { text: '❌', key: m.key }
      });
    }
  }
};
