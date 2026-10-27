const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"autoreact", alias:["areact","autoreaction"], category:"settings", desc:"Auto react to messages", react:"💫",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const s=getSettings(); const opt=(args[0]||"").toLowerCase();
    if(!opt) return sock.sendMessage(m.key.remoteJid,{text:`*⚙️ AUTOREACT*\nCurrent: ${s.autoReact?'ON ✅':'OFF ❌'}\n\nUsage:\n.autoreact on\n.autoreact off\n${WATERMARK}`},{quoted:m});
    const on=["on","enable","true","1"].includes(opt);
    updateSettings({autoReact:on});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ AutoReact ${on?'ON':'OFF'}*\n${WATERMARK}`},{quoted:m});
  }
};
