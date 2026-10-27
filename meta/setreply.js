const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"setreply", alias:["setrep","replytext"], category:"settings", desc:"Set auto reply message", react:"✏️",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const text=args.join(" ");
    if(!text) return sock.sendMessage(m.key.remoteJid,{text:`*✏️ SET REPLY*\nCurrent: ${getSettings().replyMessage}\n\nUsage:\n.setreply Hello I am busy\n${WATERMARK}`},{quoted:m});
    updateSettings({replyMessage:text});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ Reply Message Set*\n\n📝 New: ${text}\n${WATERMARK}`},{quoted:m});
  }
};
