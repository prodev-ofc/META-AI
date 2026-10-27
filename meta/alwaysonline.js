const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"alwaysonline", alias:["online","aonline"], category:"settings", desc:"Always show online", react:"🟢",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const opt=(args[0]||"").toLowerCase(); const s=getSettings();
    if(!opt) return sock.sendMessage(m.key.remoteJid,{text:`*🟢 ALWAYS ONLINE*\nCurrent: ${s.alwaysOnline?'ON ✅':'OFF ❌'}\n\nUsage:\n.alwaysonline on\n.alwaysonline off\n${WATERMARK}`},{quoted:m});
    const on=["on","enable","true","1"].includes(opt);
    updateSettings({alwaysOnline:on, alwaysOffline: on?false:s.alwaysOffline});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ AlwaysOnline ${on?'ON 🟢':'OFF'}*\n${WATERMARK}`},{quoted:m});
  }
};
