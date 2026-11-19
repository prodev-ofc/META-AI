const fs = require('fs'), path = require('path');
const DB_PATH = path.resolve(process.cwd(), 'data/chatbot.json');
const WATERMARK = "> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_";
const cooldown = new Map();

const API = {
    elite: 'https://eliteprotech-apis.zone.id/ai/deepseekai',
    knight: 'https://knightbotapi.stream/api/ai/chat?apikey=knight',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    huggingface: 'https://router.huggingface.co/v1/chat/completions'
};

const KEYS = {
    groq: process.env.GROQ_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || '',
    hf: process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || ''
};

function loadDB(){ try{ if(!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH,'{}'); return JSON.parse(fs.readFileSync(DB_PATH)) }catch{ return{} } }
function saveDB(d){ fs.mkdirSync(path.dirname(DB_PATH), {recursive:true}); fs.writeFileSync(DB_PATH, JSON.stringify(d,null,2)) }
function getText(mm){ return mm?.body || mm?.text || mm?.message?.conversation || mm?.message?.extendedTextMessage?.text || "" }
function getBotIds(sock){ return [sock.user?.id?.split(':')[0], sock.user?.lid?.split(':')[0]].filter(Boolean) }
function clean(t){ if(!t) return null; t = String(t).trim(); if(t.length < 2 || t.length > 2000) return null; return t; }

// 1. ELITE - DeepSeek
async function askElite(prompt){
  try{
    const url = `${API.elite}?text=${encodeURIComponent(prompt)}&prompt=${encodeURIComponent('You are META-AI, cool savage funny WhatsApp AI made by prodev. Keep replies short (1-2 lines), Gen Z slang.')}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const d = await r.json();
    return clean(d.result || d.response || d.message || d.data);
  }catch{ return null }
}

// 2. KNIGHT
async function askKnight(prompt){
  try{
    const url = `${API.knight}&q=${encodeURIComponent(prompt)}&query=${encodeURIComponent(prompt)}&text=${encodeURIComponent(prompt)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const d = await r.json();
    return clean(d.result || d.response || d.reply || d.message || d.data);
  }catch{ return null }
}

// 3. GROQ - needs GROQ_API_KEY
async function askGroq(prompt){
  if(!KEYS.groq) return null;
  try{
    const r = await fetch(API.groq, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEYS.groq}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are META-AI, cool savage funny WhatsApp AI made by prodev. Keep replies short (1-2 lines), Gen Z slang.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(15000)
    });
    const d = await r.json();
    return clean(d.choices?.[0]?.message?.content);
  }catch{ return null }
}

// 4. GEMINI - needs GEMINI_API_KEY
async function askGemini(prompt){
  if(!KEYS.gemini) return null;
  try{
    const r = await fetch(`${API.gemini}?key=${KEYS.gemini}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `You are META-AI, cool savage funny WhatsApp AI made by prodev. Keep replies short (1-2 lines), Gen Z slang. User: ${prompt}` }] }] }),
      signal: AbortSignal.timeout(15000)
    });
    const d = await r.json();
    return clean(d.candidates?.[0]?.content?.parts?.[0]?.text);
  }catch{ return null }
}

// 5. HUGGINGFACE - needs HF_API_KEY
async function askHF(prompt){
  if(!KEYS.hf) return null;
  try{
    const r = await fetch(API.huggingface, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEYS.hf}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [
          { role: 'system', content: 'You are META-AI, cool savage funny WhatsApp AI made by prodev. Keep replies short (1-2 lines), Gen Z slang.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300
      }),
      signal: AbortSignal.timeout(15000)
    });
    const d = await r.json();
    return clean(d.choices?.[0]?.message?.content);
  }catch{ return null }
}

// 6. DAVID
async function askDavid(prompt){
  try{
    const r = await fetch(`https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(prompt)}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    return clean(d.result || d.response || d.message);
  }catch{ return null }
}

// 7. POLLINATIONS - last resort
async function askPollinations(prompt){
  try{
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(`You are META-AI, cool savage funny WhatsApp AI made by prodev. Keep replies short (1-2 lines), Gen Z slang. User: ${prompt}`)}`, { signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    return clean(text);
  }catch{ return null }
}

async function getAI(p){
  const fns = [askElite, askKnight, askGroq, askGemini, askHF, askDavid, askPollinations];
  for(const fn of fns){
    const r = await fn(p);
    if(r) return `${r}\n\n${WATERMARK}`;
  }
  return `No cap, I got you ✨ ${p.slice(0,80)}\n\n${WATERMARK}`;
}

module.exports = {
  name: "chatbot", react: "🧠", category: "ai", alias: ["bot","chat"], desc: "AI chatbot toggle",
  execute: async (sock,m,args,{WATERMARK})=>{
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🧠",key:m.key}});
    const chatId = m.key.remoteJid; const db = loadDB(); const act = (args[0]||"").toLowerCase();
    if(!act || act==="status"){ return await sock.sendMessage(chatId,{text:`*CHATBOT MENU* 🧠\n\nStatus: ${db[chatId]?.enabled?"✅ ON":"❌ OFF"}\n\n*.chatbot on* / *off*\n\n${WATERMARK}`},{quoted:m}) }
    if(act==="on"){ db[chatId]={enabled:true}; saveDB(db); return await sock.sendMessage(chatId,{text:`✅ Chatbot ON\n\nMention "meta ai" or reply to me\n\n${WATERMARK}`},{quoted:m}) }
    if(act==="off"){ db[chatId]={enabled:false}; saveDB(db); return await sock.sendMessage(chatId,{text:`❌ Chatbot OFF\n\n${WATERMARK}`},{quoted:m}) }
  },
  async handleChatbot(sock,mm,mek){
    try{
      const m = mm || mek; const chatId = m.key?.remoteJid; const body = getText(m) || getText(mek);
      if(!chatId || !body) return false;
      if(m.key?.fromMe) return false;
      if(body.includes(WATERMARK)) return false;
      if(body.includes("PONG!")) return false;
      const db = loadDB(); if(!db[chatId]?.enabled) return false;
      const lower = body.toLowerCase(); if(lower.startsWith('.') || lower.startsWith('!')) return false;
      const now = Date.now(); if(cooldown.has(chatId) && now - cooldown.get(chatId) < 3000) return false; cooldown.set(chatId, now);
      const quotedId = m.message?.extendedTextMessage?.contextInfo?.participant || ""; const botIds = getBotIds(sock);
      const isReplyToBot = botIds.some(id => quotedId && quotedId.includes(id));
      const contains = lower.includes("meta ai") || lower.includes("meta-ai");
      if(!contains && !isReplyToBot) return false;
      console.log(`[CHATBOT] ${body}`);
      try{ await sock.sendPresenceUpdate('composing', chatId) }catch{}
      try{ await sock.sendMessage(chatId,{react:{text:"👁️",key:m.key}}) }catch{}
      let prompt = body.replace(/meta ai|meta-ai/gi,'').trim() || body;
      const reply = await getAI(prompt);
      await sock.sendMessage(chatId,{text:reply},{quoted:m}); return true;
    }catch(e){ console.log("[CHATBOT ERR]", e.message); return false }
  }
}
