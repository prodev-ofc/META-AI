const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={
  name:"meta",
  alias:["setbot","botset","settings"],
  category:"settings",
  desc:"Set BotName, OwnerName, BotImage - owner only",
  react:"⚙️",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY* - Bot & Owner only"},{quoted:m});
    const sub = (args[0]||"").toLowerCase();
    const s = getSettings();
    if(!sub){
      return sock.sendMessage(m.key.remoteJid,{text:
`╭────────────┉•┉
│◊╭─◊ *[ META SETTINGS ]*
│◊│ 🤖 BotName: ${s.botName}
│◊│ 👑 Owner: ${s.ownerName}
│◊│ 🖼️ Image: ${s.botImage}
│◊│ #️⃣ Prefix: ${s.prefix||'No prefix'}
│◊│
│◊│ Usage:
│◊│ .meta botname META-AI-V2
│◊│ .meta owner prodev zw
│◊│ .meta image (reply to image)
│◊│ .meta list
│◊╰────────────┉•┉
╰──────────────────┉
${WATERMARK}`},{quoted:m});
    }
    if(sub==="list"){ return sock.sendMessage(m.key.remoteJid,{text:`BotName: ${s.botName}\nOwner: ${s.ownerName}\nPrefix: ${s.prefix}\nImage: ${s.botImage}\n${WATERMARK}`},{quoted:m}); }
    if(sub==="botname"||sub==="name"||sub==="bot"){
      const newName=args.slice(1).join(" ");
      if(!newName) return sock.sendMessage(m.key.remoteJid,{text:"*Usage:* .meta botname NEW_NAME"},{quoted:m});
      updateSettings({botName:newName});
      return sock.sendMessage(m.key.remoteJid,{text:`*✅ BotName Changed*\n\n🤖 New Name: *${newName}*\nRestart bot to apply fully.\n${WATERMARK}`},{quoted:m});
    }
    if(sub==="owner"){
      const newOwner=args.slice(1).join(" ");
      if(!newOwner) return sock.sendMessage(m.key.remoteJid,{text:"*Usage:* .meta owner NEW_OWNER_NAME"},{quoted:m});
      updateSettings({ownerName:newOwner});
      return sock.sendMessage(m.key.remoteJid,{text:`*✅ Owner Name Changed*\n\n👑 New Owner: *${newOwner}*\n${WATERMARK}`},{quoted:m});
    }
    if(sub==="image"||sub==="img"||sub==="botimage"){
      const quoted=m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const msg=quoted||m.message;
      if(!msg?.imageMessage) return sock.sendMessage(m.key.remoteJid,{text:"*Reply to an image with* .meta image\nTo set bot menu image"},{quoted:m});
      try{
        const fs=require('fs'); const path=require('path');
        let buffer=null;
        if(sock.downloadMediaMessage){ buffer=await sock.downloadMediaMessage({message:msg}); }
        if(!buffer) return sock.sendMessage(m.key.remoteJid,{text:"❌ Failed to download image"},{quoted:m});
        const dir="./media"; if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
        fs.writeFileSync("./media/menu.jpg", buffer);
        updateSettings({botImage:"./media/menu.jpg"});
        await sock.sendMessage(m.key.remoteJid,{image:buffer, caption:`*✅ Bot Image Changed*\n${WATERMARK}`},{quoted:m});
      }catch(e){ await sock.sendMessage(m.key.remoteJid,{text:`❌ Error: ${e.message}`},{quoted:m}); }
    }
  }
};
