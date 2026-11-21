// ==================================================
//  XPRO ZLI - EDIT MESSAGE
//  Converted from XPRO-MD plugins/owner/edit.js
//  Created by XPRO-TECH by PRODEV ZW
// ==================================================
// Only bot owner can use this. Add your number(s) here:
// e.g. ["263771234567", "263772345678"]
const OWNERS = process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.split(",").map(n => n.trim()) : [];

const WATERMARK = `> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_`;

function quotedKey(m){
  const msg = m.message || {};
  const ext = msg.extendedTextMessage || msg.ephemeralMessage?.message?.extendedTextMessage;
  const ctx = ext?.contextInfo;
  if(!ctx?.stanzaId) return null;
  return {
    remoteJid: m.key.remoteJid,
    fromMe: ctx.participant ? false : true, // if no participant, likely bot's own msg - checked below
    id: ctx.stanzaId,
    participant: ctx.participant || undefined,
  };
}

function isOwner(m){
  if(m.key.fromMe) return true;
  const sender = (m.key.participant || m.key.remoteJid || "").replace(/[^0-9]/g, "");
  if(OWNERS.length === 0) return m.key.fromMe; // no owners set = only bot itself
  return OWNERS.some(o => sender.endsWith(o.replace(/[^0-9]/g, "").slice(-9)));
}

module.exports = {
  name: "edit",
  react: "✏️",
  alias: [],
  category: "owner",
  owner: true,
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
    const text = args.join(" ").trim() || (m.message?.extendedTextMessage?.text || "").replace(/^\.edit\s*/i, "").trim();

    // Owner only
    if(!isOwner(m)) return await reply(`❌ Owner only command.\n\n${WATERMARK}`);

    const key = quotedKey(m);
    if(!key) return await reply(`Reply to one of the bot's messages.\n\nUsage: .edit <new text>`);
    if(!text) return await reply(`Usage: .edit <new text>`);

    // Must be bot's own message - check quoted participant
    const msg = m.message || {};
    const ext = msg.extendedTextMessage || msg.ephemeralMessage?.message?.extendedTextMessage;
    const ctx = ext?.contextInfo;
    // In groups, bot's messages have participant = bot's LID/JID, in DM participant is empty
    // If quoted message is NOT from bot, Baileys will fail - we catch it below anyway
    // Extra guard: if quoted participant exists and is not bot, block
    const botJid = sock.user?.id?.split(":")[0];
    if(ctx?.participant && botJid && !ctx.participant.includes(botJid) && !ctx.participant.includes(sock.user?.lid || "___nope___")){
      // Still allow attempt - some Baileys versions use LID, so don't hard-block here
      // console.log('[edit] quoted participant:', ctx.participant, 'bot:', botJid);
    }

    try{
      await sock.sendMessage(jid, { react: { text: "✏️", key: m.key } });
      await sock.sendMessage(jid, { text: text.trim(), edit: key });
      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });
    }catch(error){
      await reply(`❌ Unable to edit that message: ${error.message || String(error)}\n\nMake sure you replied to a message sent by this bot.\n\n${WATERMARK}`);
    }
  }
};
