const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"autoreply", alias:["areply","autorep"], category:"settings", desc:"Auto reply to messages", react:"💬",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const s=getSettings(); const opt=(args[0]||"").toLowerCase();
    if(!opt) return sock.sendMessage(m.key.remoteJid,{text:`*⚙️ AUTOREPLY*\nCurrent: ${s.autoReply?'ON ✅':'OFF ❌'}\nText: ${s.autoReplyText}\n\nUsage:\n.autoreply on\n.autoreply off\n${WATERMARK}`},{quoted:m});
    const on=["on","enable","true","1"].includes(opt);
    updateSettings({autoReply:on});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ AutoReply ${on?'ON':'OFF'}*\n${WATERMARK}`},{quoted:m});
  }
};
