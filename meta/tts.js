const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const WATERMARK = `> ✨ META-AI | Powered by PRODEV ZW`;

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// User-friendly language aliases
const LANG_MAP = {
  sh: 'sn',
  sn: 'sn',
  shona: 'sn',
  chishona: 'sn',

  nd: 'nd',
  ndebele: 'nd',

  zu: 'zu',
  zulu: 'zu',

  xh: 'xh',
  xhosa: 'xh',

  st: 'st',
  sotho: 'st',

  en: 'en',
  english: 'en',

  fr: 'fr',
  french: 'fr',

  es: 'es',
  spanish: 'es',

  pt: 'pt',
  portuguese: 'pt',

  de: 'de',
  german: 'de',

  it: 'it',
  italian: 'it',

  ja: 'ja',
  japanese: 'ja',

  hi: 'hi',
  hindi: 'hi',

  ar: 'ar',
  arabic: 'ar',

  zh: 'zh',
  chinese: 'zh',

  ru: 'ru',
  russian: 'ru',

  sw: 'sw',
  swahili: 'sw',

  ko: 'ko',
  korean: 'ko',

  nl: 'nl',
  dutch: 'nl',

  tr: 'tr',
  turkish: 'tr',

  pl: 'pl',
  polish: 'pl',

  th: 'th',
  thai: 'th',

  bn: 'bn',
  bengali: 'bn',

  ur: 'ur',
  urdu: 'ur',

  ta: 'ta',
  tamil: 'ta',

  te: 'te',
  telugu: 'te',

  uk: 'uk',
  ukrainian: 'uk',

  sv: 'sv',
  swedish: 'sv',

  no: 'no',
  norwegian: 'no',

  da: 'da',
  danish: 'da',

  fi: 'fi',
  finnish: 'fi',

  el: 'el',
  greek: 'el',

  cs: 'cs',
  czech: 'cs',

  ro: 'ro',
  romanian: 'ro',

  hu: 'hu',
  hungarian: 'hu',

  vi: 'vi',
  vietnamese: 'vi',

  id: 'id',
  indonesian: 'id',

  ms: 'ms',
  malay: 'ms',

  he: 'he',
  hebrew: 'he'
};

// Extract text from quoted/replied messages
function getQuotedText(m) {
  // Framework parsed quoted message
  if (m.quoted) {
    const q = m.quoted;

    if (q.text) return q.text;
    if (q.caption) return q.caption;
    if (q.body) return q.body;
    if (q.conversation) return q.conversation;

    if (q.extendedTextMessage?.text) {
      return q.extendedTextMessage.text;
    }

    if (q.imageMessage?.caption) {
      return q.imageMessage.caption;
    }

    if (q.videoMessage?.caption) {
      return q.videoMessage.caption;
    }

    if (q.documentMessage?.caption) {
      return q.documentMessage.caption;
    }
  }

  // Raw Baileys quoted message fallback
  const contextInfo =
    m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo ||
    m.message?.documentMessage?.contextInfo ||
    m.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo ||
    m.message?.viewOnceMessage?.message?.extendedTextMessage?.contextInfo ||
    m.message?.viewOnceMessageV2?.message?.extendedTextMessage?.contextInfo;

  const quoted = contextInfo?.quotedMessage;

  if (!quoted) return '';

  const q =
    quoted.ephemeralMessage?.message ||
    quoted.viewOnceMessage?.message ||
    quoted.viewOnceMessageV2?.message ||
    quoted;

  return (
    q.conversation ||
    q.extendedTextMessage?.text ||
    q.imageMessage?.caption ||
    q.videoMessage?.caption ||
    q.documentMessage?.caption ||
    q.audioMessage?.caption ||
    ''
  );
}

// Generate MP3 audio
function generateTTS(text, language, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const speech = new gTTS(text, language);

      speech.save(filePath, error => {
        if (error) return reject(error);
        resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Send reaction safely
async function react(sock, m, emoji) {
  try {
    await sock.sendMessage(m.key.remoteJid, {
      react: {
        text: emoji,
        key: m.key
      }
    });
  } catch {}
}

module.exports = {
  name: 'tts',
  alias: ['say', 'gtts', 'speak', 'voice'],
  category: 'tools',
  desc: 'Convert text into speech in multiple languages',

  async execute(sock, m, args, { WATERMARK: BOT_WATERMARK } = {}) {
    const jid = m.key.remoteJid;

    const watermark =
      BOT_WATERMARK ||
      WATERMARK;

    let rawArgs = Array.isArray(args) ? [...args] : [];

    // Fallback: extract command arguments from message text
    if (!rawArgs.length) {
      const body =
        m.text ||
        m.body ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        '';

      rawArgs = body.trim().split(/\s+/).slice(1);
    }

    let language = 'en';
    let text = rawArgs.join(' ').trim();

    // .tts sh Hello
    // .tts sn Hello
    // .tts shona Hello
    if (rawArgs.length && LANG_MAP[rawArgs[0].toLowerCase()]) {
      language = LANG_MAP[rawArgs[0].toLowerCase()];
      text = rawArgs.slice(1).join(' ').trim();
    }

    // Support common language codes even if not in the alias map
    else if (
      rawArgs.length >= 2 &&
      /^[a-z]{2,3}$/i.test(rawArgs[0])
    ) {
      language = rawArgs[0].toLowerCase();
      text = rawArgs.slice(1).join(' ').trim();
    }

    // If no text was provided, use quoted message
    if (!text) {
      text = getQuotedText(m).trim();
    }

    if (!text) {
      return sock.sendMessage(
        jid,
        {
          text:
            `╭━━〔 *META-AI TEXT TO SPEECH* 〕━━╮\n` +
            `│\n` +
            `│ 🔊 Convert text into audio\n` +
            `│\n` +
            `│ *Usage:*\n` +
            `│ .tts Hello world\n` +
            `│ .tts sh Mhoro shamwari\n` +
            `│ .tts fr Bonjour\n` +
            `│\n` +
            `│ *Reply to a message:*\n` +
            `│ .tts\n` +
            `│ .tts sh\n` +
            `│\n` +
            `│ *Languages:*\n` +
            `│ en English\n` +
            `│ sh/sn Shona\n` +
            `│ nd Ndebele\n` +
            `│ zu Zulu\n` +
            `│ xh Xhosa\n` +
            `│ fr French\n` +
            `│ es Spanish\n` +
            `│ de German\n` +
            `│ ja Japanese\n` +
            `│ hi Hindi\n` +
            `│ pt Portuguese\n` +
            `│ sw Swahili\n` +
            `│ And many more...\n` +
            `│\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
            `${watermark}`
        },
        { quoted: m }
      );
    }

    // Prevent very large text requests
    if (text.length > 5000) {
      return sock.sendMessage(
        jid,
        {
          text:
            `⚠️ *TEXT TOO LONG*\n\n` +
            `Maximum supported text length is 5,000 characters.\n` +
            `Your text contains ${text.length} characters.\n\n` +
            `${watermark}`
        },
        { quoted: m }
      );
    }

    const fileName = `META-AI_TTS_${Date.now()}.mp3`;
    const filePath = path.join(TEMP_DIR, fileName);

    await react(sock, m, '🔊');

    try {
      await sock.sendMessage(
        jid,
        {
          text: `🎙️ *META-AI is generating your voice...*\n🌐 Language: ${language}\n\n${watermark}`
        },
        { quoted: m }
      );

      await generateTTS(text, language, filePath);

      if (!fs.existsSync(filePath)) {
        throw new Error('Audio file was not created.');
      }

      const audioBuffer = fs.readFileSync(filePath);

      if (!audioBuffer.length) {
        throw new Error('Generated audio file is empty.');
      }

      await sock.sendMessage(
        jid,
        {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName
        },
        { quoted: m }
      );

      await react(sock, m, '✅');

    } catch (error) {
      console.error('[META-AI TTS]', error.message);

      // Shona fallback if the Google TTS service cannot generate it
      if (language === 'sn') {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          await generateTTS(text, 'en', filePath);

          const fallbackBuffer = fs.readFileSync(filePath);

          await sock.sendMessage(
            jid,
            {
              text:
                `⚠️ Shona voice was unavailable.\n` +
                `Using English fallback voice instead.\n\n` +
                `${watermark}`
            },
            { quoted: m }
          );

          await sock.sendMessage(
            jid,
            {
              audio: fallbackBuffer,
              mimetype: 'audio/mpeg',
              ptt: false,
              fileName
            },
            { quoted: m }
          );

          await react(sock, m, '✅');
          return;

        } catch (fallbackError) {
          console.error(
            '[META-AI TTS FALLBACK]',
            fallbackError.message
          );
        }
      }

      await react(sock, m, '❌');

      await sock.sendMessage(
        jid,
        {
          text:
            `❌ *VOICE GENERATION FAILED*\n\n` +
            `${error.message || 'Unknown error'}\n\n` +
            `Try again or use a different language.\n\n` +
            `${watermark}`
        },
        { quoted: m }
      );

    } finally {
      // Always delete temporary audio files
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.log(
          '[META-AI TTS CLEANUP]',
          cleanupError.message
        );
      }
    }
  }
};
