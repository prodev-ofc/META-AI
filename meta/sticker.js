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
  name:"sticker",
  alias:["s","stiker","stik","make sticker","stick"],
  category:"tools",
  desc:"Create sticker from image/video - reply to image with .sticker",
  react:"✨",
  execute: async(sock,m,args,{WATERMARK})=>{
    const jid=m.key.remoteJid;
    const quoted=m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg=quoted||m.message;

    const getMedia=()=>{
      if(msg.imageMessage) return {type:'image', raw:msg};
      if(msg.videoMessage) return {type:'video', raw:msg};
      if(msg.stickerMessage) return {type:'sticker', raw:msg};
      return null;
    };
    const media=getMedia();
    if(!media){
      return sock.sendMessage(jid,{text:`*✨ STICKER MAKER*\n\nReply to an image/video with:\n.sticker\n\nOr send image with caption .sticker\n\nMax 10sec video\n${WATERMARK}`},{quoted:m});
    }
    try{
      await sock.sendMessage(jid,{react:{text:"⏳",key:m.key}});
      let buffer=null;
      if(m.download){ try{ buffer=await m.download(); }catch{} }
      if(!buffer && sock.downloadMediaMessage){ try{ buffer=await sock.downloadMediaMessage({message:media.raw}); }catch{} }
      if(!buffer) buffer=await downloadMedia(media.raw);
      if(!buffer) throw new Error("Failed to download media");

      // If video longer than 10s, trim? For now just send
      await sock.sendMessage(jid,{sticker:buffer},{quoted:m});
      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}});
    }catch(e){
      console.log("sticker error",e);
      await sock.sendMessage(jid,{text:`❌ Failed: ${e.message}`},{quoted:m});
    }
  }
};
