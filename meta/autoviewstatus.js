const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"autoviewstatus", alias:["viewstatus","aviewstatus","autostatusview"], category:"settings", desc:"Auto view status", react:"👁️",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const opt=(args[0]||"").toLowerCase(); const s=getSettings();
    if(!opt) return sock.sendMessage(m.key.remoteJid,{text:`*👁️ AUTO VIEW STATUS*\nCurrent: ${s.autoViewStatus?'ON ✅':'OFF ❌'}\n\nUsage:\n.autoviewstatus on\n.autoviewstatus off\n${WATERMARK}`},{quoted:m});
    const on=["on","enable","true","1"].includes(opt);
    updateSettings({autoViewStatus:on});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ AutoViewStatus ${on?'ON':'OFF'}*\n${WATERMARK}`},{quoted:m});
  }
};
