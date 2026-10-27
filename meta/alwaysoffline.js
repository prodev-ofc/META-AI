const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"alwaysoffline", alias:["offline","aoffline"], category:"settings", desc:"Always show offline", react:"⚫",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const opt=(args[0]||"").toLowerCase(); const s=getSettings();
    if(!opt) return sock.sendMessage(m.key.remoteJid,{text:`*⚫ ALWAYS OFFLINE*\nCurrent: ${s.alwaysOffline?'ON ✅':'OFF ❌'}\n\nUsage:\n.alwaysoffline on\n.alwaysoffline off\n${WATERMARK}`},{quoted:m});
    const on=["on","enable","true","1"].includes(opt);
    updateSettings({alwaysOffline:on, alwaysOnline: on?false:s.alwaysOnline});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ AlwaysOffline ${on?'ON ⚫':'OFF'}*\n${WATERMARK}`},{quoted:m});
  }
};
