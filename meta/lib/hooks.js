const { getSettings } = require('./settings');

// Random emojis for autoreact / status react
const EMOJIS = ["❤️","😂","🥰","😍","🔥","😮","🥺","😎","🤩","🙏","✨","💯","👏","😅","🤣"];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

async function handleHooks(sock, m){
  try{
    const s = getSettings();
    const jid = m.key.remoteJid;

    // 1. ALWAYS ONLINE / OFFLINE
    try{
      if(s.alwaysOnline) await sock.sendPresenceUpdate('available', jid);
      if(s.alwaysOffline) await sock.sendPresenceUpdate('unavailable', jid);
    }catch{}

    // 2. AUTO VIEW STATUS + REACT + REPLY
    if(jid === "status@broadcast"){
      // Auto view status
      if(s.autoViewStatus){
        try{ await sock.readMessages([m.key]); }catch{}
      }
      // Auto react to status
      if(s.autoStatusReact){
        try{
          const emoji = pick(EMOJIS);
          await sock.sendMessage(jid, { react: { text: emoji, key: m.key } }, { statusJidList: [m.key.participant || m.participant] });
        }catch(e){ console.log("status react fail", e.message); }
      }
      // Auto reply to status
      if(s.autoStatusReply && s.statusReplyText){
        try{
          const participant = m.key.participant || m.participant;
          if(participant) await sock.sendMessage(participant, { text: s.statusReplyText });
        }catch{}
      }
      return; // don't do normal autoreact/reply for status
    }

    // Ignore bot own messages
    if(m.key.fromMe) return;

    // 3. AUTO REACT TO ALL MESSAGES
    if(s.autoReact){
      try{
        const emoji = pick(EMOJIS);
        await sock.sendMessage(jid, { react: { text: emoji, key: m.key } });
      }catch{}
    }

    // 4. AUTO REPLY TO ALL MESSAGES (only if not a command)
    if(s.autoReply){
      const body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
      const isCmd = body.startsWith(s.prefix || ".") || (s.prefix==="" && false);
      if(!isCmd && body){
        try{ await sock.sendMessage(jid, { text: s.replyMessage || s.autoReplyText }, { quoted: m }); }catch{}
      }
    }

  }catch(e){ console.log("hooks error", e.message); }
}

module.exports = { handleHooks };
