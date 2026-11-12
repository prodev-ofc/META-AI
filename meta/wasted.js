const axios = require('axios');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

module.exports={
  name:"wasted",
  react:"💀",
  alias:["gta","rip"],
  category:"fun",
  desc:"Wasted overlay on user",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    let userToWaste;

    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      userToWaste = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
      userToWaste = m.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToWaste) {
      return sock.sendMessage(jid, { text: `Please mention someone or reply to their message to waste them!\n\nEx: .wasted @user\n\n${WATERMARK}` }, { quoted: m });
    }

    try{
      await sock.sendMessage(jid,{react:{text:"💀",key:m.key}})

      let profilePic;
      try{
        profilePic = await sock.profilePictureUrl(userToWaste, 'image');
      }catch{
        profilePic = 'https://i.imgur.com/2wzGhpF.jpeg';
      }

      const wastedResponse = await axios.get(
        `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`,
        { responseType: 'arraybuffer' }
      );

      await sock.sendMessage(jid,{
        image: Buffer.from(wastedResponse.data),
        caption: `⚰️ *WASTED* : @${userToWaste.split('@')[0]} 💀\nRest in pieces!\n\n${WATERMARK}`,
        mentions: [userToWaste]
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log('[wasted] error:', e.message)
      await sock.sendMessage(jid, { text: `❌ Failed to create wasted image: ${e.message}\n\n${WATERMARK}` }, { quoted: m });
    }
  }
}
