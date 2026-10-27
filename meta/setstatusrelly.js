const {getSettings,updateSettings}=require('./lib/settings');
const {isOwnerCheck}=require('./lib/isOwner');
module.exports={
  name:"setstatusrelly",
  alias:["setstatusreply","setstatusrep","statusreplytext"],
  category:"settings",
  desc:"Set status reply text - owner only",
  react:"✏️",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*\nBot & Owner only"},{quoted:m});
    const text=args.join(" ");
    const s=require('./lib/settings').getSettings();
    if(!text) return sock.sendMessage(m.key.remoteJid,{text:`*✏️ SET STATUS REPLY*\nCurrent: ${s.statusReplyText}\n\nUsage:\n.setstatusrelly Nice status bro ❤️\n.setstatusrelly Your status is fire 🔥\n${WATERMARK}`},{quoted:m});
    updateSettings({statusReplyText:text});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ Status Reply Set*\n\n📝 New: ${text}\n${WATERMARK}`},{quoted:m});
  }
};

