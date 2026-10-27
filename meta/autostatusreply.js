const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"autostatusreply", alias:["statusreply","asreply"], category:"settings", desc:"Auto reply to status", react:"💬",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const opt=(args[0]||"").toLowerCase(); const s=getSettings();
    if(!opt) return sock.sendMessage(m.key.remoteJid,{text:`*💬 AUTO STATUS REPLY*\nCurrent: ${s.autoStatusReply?'ON ✅':'OFF ❌'}\nText: ${s.statusReplyText}\n\nUsage:\n.autostatusreply on\n.autostatusreply off\n${WATERMARK}`},{quoted:m});
    const on=["on","enable","true","1"].includes(opt);
    updateSettings({autoStatusReply:on});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ AutoStatusReply ${on?'ON':'OFF'}*\n${WATERMARK}`},{quoted:m});
  }
};
