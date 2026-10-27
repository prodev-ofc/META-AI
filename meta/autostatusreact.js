const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"autostatusreact", alias:["statusreact","asreact"], category:"settings", desc:"Auto react to status", react:"❤️",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const opt=(args[0]||"").toLowerCase(); const s=getSettings();
    if(!opt) return sock.sendMessage(m.key.remoteJid,{text:`*❤️ AUTO STATUS REACT*\nCurrent: ${s.autoStatusReact?'ON ✅':'OFF ❌'}\n\nUsage:\n.autostatusreact on\n.autostatusreact off\n${WATERMARK}`},{quoted:m});
    const on=["on","enable","true","1"].includes(opt);
    updateSettings({autoStatusReact:on});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ AutoStatusReact ${on?'ON':'OFF'}*\n${WATERMARK}`},{quoted:m});
  }
};
