// ==================================================
//  XPRO ZLI - BOT MODE (SELF / PUBLIC)
//  Converted from XPRO-MD plugins/owner/mode.js
//  Created by XPRO-TECH by PRODEV ZW
// ==================================================
const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

const SETTINGS_PATH = path.join(process.cwd(), 'database', 'settings.json');
const WATERMARK = `> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_`;

// Only bot owner can use this. Add your number(s) here:
const OWNERS = process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.split(",").map(n => n.trim()) : [];

function readSettings(){
  try{ return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')); }catch{ return {}; }
}
function writeSettings(data){
  try{
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
  }catch{}
}

function isOwner(m){
  if(m.key.fromMe) return true;
  const sender = (m.key.participant || m.key.remoteJid || "").replace(/[^0-9]/g, "");
  if(OWNERS.length === 0) return m.key.fromMe;
  return OWNERS.some(o => sender.endsWith(o.replace(/[^0-9]/g, "").slice(-9)));
}

async function setMode(sock, m, choice){
  global.botMode = choice;
  const settings = readSettings();
  settings.mode = choice;
  writeSettings(settings);
  await sock.sendMessage(m.key.remoteJid, {
    text: `✅ Bot mode set to *${choice.toUpperCase()}*.${choice === 'self' ? ' Only the owner can use commands now.' : ' Anyone can use commands now.'}`
  }, { quoted: m });
  await sendModeButtons(sock, m);
}

async function sendModeButtons(sock, m){
  const jid = m.key.remoteJid;
  const prefix = '.';
  const current = global.botMode || readSettings().mode || 'public';
  const text = `⚙️ *BOT MODE*\n\n*Current Mode:* ${current === 'self' ? '🔒 SELF' : '🌍 PUBLIC'}\n\n${current === 'self' ? 'Only owner can use commands now.' : 'Anyone can use commands now.'}\n\n👇 Tap a button to change mode:`;

  const content = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({ text }),
          footer: proto.Message.InteractiveMessage.Footer.create({ text: `ᴘᴏᴡᴇʀᴇᴅ ʙʏ xᴘʀᴏ-ᴛᴇᴄʜ©` }),
          header: proto.Message.InteractiveMessage.Header.create({
            title: `⚙️ XPRO-MD MODE`,
            subtitle: `BY PRODEV ZW`,
            hasMediaAttachment: false
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [
              // FIX: display_text MUST be the command, because WhatsApp sends back display_text, not id
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `${prefix}mode self`, id: `${prefix}mode self` }) },
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `${prefix}mode public`, id: `${prefix}mode public` }) }
            ]
          })
        })
      }
    }
  }, { quoted: m });

  await sock.relayMessage(jid, content.message, {
    messageId: content.key.id,
    additionalNodes: [{
      tag: 'biz', attrs: {},
      content: [{
        tag: 'interactive', attrs: { type: 'native_flow', v: '1' },
        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
      }]
    }]
  });
}

module.exports = {
  name: "mode",
  react: "⚙️",
  alias: [],
  category: "owner",
  owner: true,
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    if(!isOwner(m)) return await reply(`❌ Owner only command.\n\n${WATERMARK}`);

    const choice = args[0]?.toLowerCase();
    if(!choice) return await sendModeButtons(sock, m);
    if(choice !== 'self' && choice !== 'public'){
      await reply(`❌ Invalid mode. Usage: .mode self | .mode public`);
      return await sendModeButtons(sock, m);
    }
    await setMode(sock, m, choice);
  }
};
