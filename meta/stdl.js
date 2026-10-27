const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function downloadMedia(rawMsg){
  try{
    const type = Object.keys(rawMsg)[0];
    const msgObj = rawMsg[type];
    const stream = await downloadContentFromMessage(msgObj, type.replace('Message',''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
  }catch(e){ return null; }
}

module.exports={
  name:"stdl",
  alias:["stickerdl","dlsticker","steal","take","sdl"],
  category:"tools",
  desc:"Download sticker as image - reply to sticker with .stdl",
  react:"📥",
  execute: async(sock,m,args,{WATERMARK})=>{
    const jid=m.key.remoteJid;
    const quoted=m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg=quoted||m.message;

    const getMedia=()=>{
      if(msg.stickerMessage) return {type:'sticker', raw:msg};
      if(msg.imageMessage) return {type:'image', raw:msg};
      return null;
    };
    const media=getMedia();
    if(!media || media.type!=='sticker'){
      return sock.sendMessage(jid,{text:`*📥 STICKER DL*\n\nReply to a sticker with:\n.stdl\n\nTo save sticker as image\n${WATERMARK}`},{quoted:m});
    }
    try{
      await sock.sendMessage(jid,{react:{text:"⏳",key:m.key}});
      let buffer=null;
      if(m.download){ try{ buffer=await m.download(); }catch{} }
      if(!buffer && sock.downloadMediaMessage){ try{ buffer=await sock.downloadMediaMessage({message:media.raw}); }catch{} }
      if(!buffer) buffer=await downloadMedia(media.raw);
      if(!buffer) throw new Error("Failed to download sticker");

      // Send as image (WhatsApp will convert webp to png/jpg viewable)
      await sock.sendMessage(jid,{image:buffer, caption:`*📥 STICKER DOWNLOADED*\n${WATERMARK}`},{quoted:m});
      // Also send as file
      // await sock.sendMessage(jid,{document:buffer, mimetype:'image/webp', fileName:`sticker_${Date.now()}.webp`},{quoted:m});
      
      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}});
    }catch(e){
      console.log("stdl error",e);
      await sock.sendMessage(jid,{text:`❌ Failed: ${e.message}`},{quoted:m});
    }
  }
};
