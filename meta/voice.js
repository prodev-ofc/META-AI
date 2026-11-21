// ==================================================
//  XPRO ZLI - VOICE AI
//  Merged: plugins/ai/deepseek.js + plugins/tools/tts.js
//  Created by XPRO-TECH by PRODEV ZW
//  AI: https://eliteprotech-apis.zone.id/ai/deepseekai
//  TTS: gTTS (Google Text-to-Speech)
// ==================================================
const axios = require('axios');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://eliteprotech-apis.zone.id/ai/deepseekai';
const WATERMARK = `> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_`;
const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Map user lang -> Google TTS lang
const LANG_MAP = {
  sh: 'sn', shona: 'sn', chishona: 'sn', sn: 'sn',
  ndebele: 'nd', nd: 'nd',
  zulu: 'zu', zu: 'zu',
  xhosa: 'xh', sotho: 'st', st: 'st',
  en: 'en', english: 'en',
  fr: 'fr', french: 'fr', es: 'es', de: 'de',
  pt: 'pt', ja: 'ja', hi: 'hi', ar: 'ar',
};

function apiError(data, fallback){
  if(typeof data === 'string' && data.trim()) return data.trim();
  if(data?.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  if(data?.message) return String(data.message);
  return fallback;
}

function getQuotedText(m){
  // meta/ style quoted
  const msg = m.message || {};
  const ext = msg.extendedTextMessage || msg.ephemeralMessage?.message?.extendedTextMessage;
  const ctx = ext?.contextInfo;
  const q = ctx?.quotedMessage;
  if(!q) return "";
  return q.conversation || q.extendedTextMessage?.text || q.imageMessage?.caption || q.videoMessage?.caption || "";
}

function generateTTS(text, lang, filePath){
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, lang);
    gtts.save(filePath, (err) => {
      if(err) return reject(err);
      resolve(filePath);
    });
  });
}

// Clean AI answer for speaking - no markdown, no emojis spam
function cleanForSpeech(text){
  return String(text)
    .replace(/\*\*/g, '').replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '').replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[😀-🙏🌀-🗿🚀-🛿☀-➿✨🔥💡🎉]/gu, '')
    .replace(/\s+/g, ' ').trim()
    .slice(0, 900); // gTTS limit - keep voice short
}

module.exports = {
  name: "voice",
  react: "🔊",
  alias: ["speak", "talk", "voiceai", "aivoice"],
  category: "ai",
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    let rawArgs = args;
    if(!rawArgs || !rawArgs.length){
      const body = m.message?.extendedTextMessage?.text || m.message?.conversation || "";
      rawArgs = body.trim().split(/\s+/).slice(1);
    }

    // Language: .voice sh Mhoro / .voice en How are you
    let language = 'en';
    let text = rawArgs.join(" ").trim();
    if(rawArgs.length >= 1 && LANG_MAP[rawArgs[0].toLowerCase()]){
      language = LANG_MAP[rawArgs[0].toLowerCase()];
      text = rawArgs.slice(1).join(" ").trim();
    } else if(rawArgs.length >= 2 && /^[a-z]{2}$/i.test(rawArgs[0])){
      language = rawArgs[0].toLowerCase();
      text = rawArgs.slice(1).join(" ").trim();
    }

    // If no text, use replied message
    if(!text) text = getQuotedText(m).trim();

    if(!text) return await reply(
      `🔊 *XPRO VOICE AI*\n\n` +
      `AI replies with *voice*, not text.\n\n` +
      `Usage:\n.voice how are you?\n.voice sh Mhoro, makadii?\n.voice who is Prodev?\n\n` +
      `Reply to a message + .voice\nReply + .voice sh\n\n` +
      `Aliases: .speak, .talk\n\n${WATERMARK}`
    );

    if(text.length > 16000) return await reply(`❌ Prompt too long. Use shorter message.\n\n${WATERMARK}`);

    // For Shona, tell AI to answer in Shona
    let prompt = text;
    if(language === 'sn') prompt = `Answer in Shona (ChiShona, Zimbabwe). Keep it short, simple, friendly, max 3 sentences: ${text}`;
    if(language === 'nd') prompt = `Answer in Ndebele. Keep it short, max 3 sentences: ${text}`;

    const fileName = `voice-${Date.now()}.mp3`;
    const filePath = path.join(TEMP_DIR, fileName);

    try{
      await sock.sendMessage(jid, { react: { text: "🔊", key: m.key } });
      await sock.sendMessage(jid, { text: `✦ Generating voice @${m.key.participant?.split('@')[0] || 'you'}...` }, { quoted: m });

      // 1. AI - DeepSeek
      const response = await axios.get(API_URL, {
        params: { prompt },
        timeout: 90000,
        validateStatus: () => true,
        headers: { Accept: 'application/json' }
      });
      const data = response.data;
      if(response.status < 200 || response.status >= 300 || data?.success === false){
        return await reply(`❌ AI request failed: ${apiError(data, `HTTP ${response.status}`)}\n\n${WATERMARK}`);
      }
      const answer = typeof data?.response === 'string' ? data.response.trim() : '';
      if(!answer) return await reply(`❌ AI returned no response.\n\n${WATERMARK}`);

      // 2. TTS - Speak the AI answer
      const speakText = cleanForSpeech(answer);
      if(!speakText) return await reply(`❌ Nothing to speak.\n\n${WATERMARK}`);

      try{
        await generateTTS(speakText, language, filePath);
      }catch(e){
        // Shona fails on gTTS sometimes - fallback to English voice
        console.log('[voice] tts fallback:', e.message);
        await generateTTS(speakText, 'en', filePath);
      }

      // 3. Send VOICE NOTE (ptt: true = voice note bubble)
      await sock.sendMessage(jid, {
        audio: { url: filePath },
        mimetype: 'audio/mpeg',
        ptt: true,
        caption: `🔊 *XPRO VOICE AI*\n\n> _${cleanForSpeech(answer).slice(0, 150)}..._\n\n${WATERMARK}`
      }, { quoted: m });

      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });
      try{ fs.unlinkSync(filePath); }catch{}

    }catch(e){
      console.log('[voice] error:', e.message);
      await reply(`❌ Error: ${e.message}\n\n${WATERMARK}`);
      try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); }catch{}
    }
  }
};
