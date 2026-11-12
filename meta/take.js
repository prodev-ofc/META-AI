const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

module.exports={
  name:"take",
  react:"✏️",
  alias:["steal","pack","rename"],
  category:"sticker",
  desc:"Take sticker pack name",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    const packname = args.join(' ') || 'META-AI'

    try{
      const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMessage?.stickerMessage) {
        return sock.sendMessage(chatId, { text: `❌ Reply to a sticker with .take <packname>\n\nExample:\n.take ${WATERMARK}\n\n${WATERMARK}` },{quoted:m});
      }

      await sock.sendMessage(chatId,{react:{text:"✏️",key:m.key}})

      const stickerBuffer = await downloadMediaMessage(
        {
          key: m.message.extendedTextMessage.contextInfo.stanzaId,
          message: quotedMessage,
          messageType: 'stickerMessage'
        },
        'buffer',
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      );

      if (!stickerBuffer) {
        return sock.sendMessage(chatId, { text: '❌ Failed to download sticker' },{quoted:m});
      }

      const img = new webp.Image();
      await img.load(stickerBuffer);

      const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': packname,
        'sticker-pack-publisher': 'META-AI',
        'emojis': ['🤖']
      };

      const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
      const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
      const exif = Buffer.concat([exifAttr, jsonBuffer]);
      exif.writeUIntLE(jsonBuffer.length, 14, 4);

      img.exif = exif;

      const finalBuffer = await img.save(null);

      await sock.sendMessage(chatId, { sticker: finalBuffer }, { quoted: m });
      await sock.sendMessage(chatId,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log('[take] error:', e.message)
      await sock.sendMessage(chatId, { text: `❌ Error processing sticker: ${e.message}\n\n${WATERMARK}` },{quoted:m});
    }
  }
}
