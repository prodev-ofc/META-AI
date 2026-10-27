const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={ name:"setwatermark", alias:["watermark","setwm","wm"], category:"settings", desc:"Set bot watermark/footer", react:"💧",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const text=args.join(" ");
    const s=getSettings();
    if(!text) return sock.sendMessage(m.key.remoteJid,{text:`*💧 SET WATERMARK*\nCurrent: ${s.watermark}\n\nUsage:\n.setwatermark > My Bot Footer\n.setwatermark off -> reset to default\n${WATERMARK}`},{quoted:m});
    if(text.toLowerCase()==="off"||text.toLowerCase()==="reset"){
      updateSettings({watermark:"> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"});
      return sock.sendMessage(m.key.remoteJid,{text:`*✅ Watermark Reset*\n${WATERMARK}`},{quoted:m});
    }
    updateSettings({watermark:text});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ Watermark Set*\n\nNew:\n${text}\n${WATERMARK}`},{quoted:m});
  }
};
