const settings = require('../settings');
const { addSudo, removeSudo, getSudoList } = require('../lib/index');
const isOwnerOrSudo = require('../lib/isOwner');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

function extractMentionedJid(m) {
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length > 0) return mentioned[0];
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const match = text.match(/\b(\d{7,15})\b/);
  if (match) return match[1] + '@s.whatsapp.net';
  return null;
}

module.exports={
  name:"sudo",
  react:"👑",
  alias:["user","mods","sudoers"],
  category:"owner",
  desc:"Add/remove/list sudo users",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    const senderJid=m.key.participant || m.key.remoteJid
    const sub = (args[0] || '').toLowerCase();

    if (!sub || !['add','del','remove','list'].includes(sub)) {
      return sock.sendMessage(chatId, { text: `Usage:\n.sudo add @user\n.sudo del @user\n.sudo list\n\n${WATERMARK}` },{quoted:m});
    }

    if (sub === 'list') {
      const list = await getSudoList();
      if (list.length === 0) return sock.sendMessage(chatId, { text: `No sudo users set.\n\n${WATERMARK}` },{quoted:m});
      const text = list.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n');
      return sock.sendMessage(chatId, { 
        text: `*👑 Sudo users:*\n${text}\n\n${WATERMARK}`,
        mentions: list
      },{quoted:m});
    }

    const isOwner = m.key.fromMe || await isOwnerOrSudo(senderJid, sock, chatId);
    if (!isOwner) {
      return sock.sendMessage(chatId, { text: '❌ Only owner can add/remove sudo users.' },{quoted:m});
    }

    const targetJid = extractMentionedJid(m);
    if (!targetJid) {
      return sock.sendMessage(chatId, { text: 'Please mention a user or provide a number.\nEx: .sudo add @user' },{quoted:m});
    }

    if (sub === 'add') {
      const ok = await addSudo(targetJid);
      return sock.sendMessage(chatId, { 
        text: ok ? `✅ Added sudo: @${targetJid.split('@')[0]}\n\n${WATERMARK}` : '❌ Failed to add sudo',
        mentions: [targetJid]
      },{quoted:m});
    }

    if (sub === 'del' || sub === 'remove') {
      const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
      if (targetJid === ownerJid) {
        return sock.sendMessage(chatId, { text: 'Owner cannot be removed.' },{quoted:m});
      }
      const ok = await removeSudo(targetJid);
      return sock.sendMessage(chatId, { text: ok ? `✅ Removed sudo: ${targetJid}\n\n${WATERMARK}` : '❌ Failed to remove sudo' },{quoted:m});
    }
  }
}
