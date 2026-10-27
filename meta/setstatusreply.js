const {getSettings,updateSettings}=require('./lib/settings');
const {isOwnerCheck}=require('./lib/isOwner');
module.exports={
  name:"setstatusreply",
  alias:["setstatusrelly","setstatusrep"],
  category:"settings",
  desc:"Set status reply text - owner only",
  react:"✏️",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const text=args.join(" ");
    if(!text) return sock.sendMessage(m.key.remoteJid,{text:`*SET STATUS REPLY*\nCurrent: ${getSettings().statusReplyText}\n\n.setstatusreply Nice status ❤️\n${WATERMARK}`},{quoted:m});
    updateSettings({statusReplyText:text});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ Status Reply:* ${text}\n${WATERMARK}`},{quoted:m});
  }
};
