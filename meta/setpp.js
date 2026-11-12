const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const isOwnerOrSudo = require('../lib/isOwner');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

module.exports={
  name:"setpp",
  react:"🖼️",
  alias:["setprofile","setbotpp"],
  category:"owner",
  desc:"Set bot profile picture by replying to image",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    const senderId=m.key.participant || m.key.remoteJid

    try{
      const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
      if (!m.key.fromMe && !isOwner) {
        return sock.sendMessage(chatId, { text: '❌ This command is only available for the owner!' }, {quoted:m});
      }

      const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMessage) {
        return sock.sendMessage(chatId, { text: '⚠️ Please reply to an image with the .setpp command!' }, {quoted:m});
      }

      const imageMessage = quotedMessage.imageMessage;
      if (!imageMessage) {
        return sock.sendMessage(chatId, { text: '❌ The replied message must contain an image!' }, {quoted:m});
      }

      await sock.sendMessage(chatId,{react:{text:"🖼️",key:m.key}})

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const stream = await downloadContentFromMessage(imageMessage, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const imagePath = path.join(tmpDir, `profile_${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, buffer);

      await sock.updateProfilePicture(sock.user.id, { url: imagePath });

      fs.unlinkSync(imagePath);

      await sock.sendMessage(chatId, { text: `✅ Successfully updated bot profile picture!\n\n${WATERMARK}` }, {quoted:m});
      await sock.sendMessage(chatId,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.error('[setpp] error:', e)
      await sock.sendMessage(chatId, { text: `❌ Failed to update profile picture: ${e.message}` }, {quoted:m});
    }
  }
}
