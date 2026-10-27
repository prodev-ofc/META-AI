const { getSettings, updateSettings } = require('./lib/settings');
const { isOwnerCheck } = require('./lib/isOwner');
module.exports={
  name:"prefix",
  alias:["setprefix","pref","px"],
  category:"settings",
  desc:"Set bot prefix - max 3 chars or no prefix",
  react:"🔣",
  execute: async(sock,m,args,{WATERMARK})=>{
    if(!isOwnerCheck(m,sock)) return sock.sendMessage(m.key.remoteJid,{text:"*❌ OWNER ONLY*"}, {quoted:m});
    const s=getSettings();
    let newPref=args[0];
    if(!newPref || newPref.toLowerCase()==="list"||newPref.toLowerCase()==="current"){
      return sock.sendMessage(m.key.remoteJid,{text:
`╭─❏ PREFIX SETTINGS ❏
│ Current: [${s.prefix||'NO PREFIX'}]
│
│ Usage:
│ .prefix .    -> set to .
│ .prefix !    -> set to !
│ .prefix multi -> set to multi (max 3 chars)
│ .prefix none / off / noprefix -> No prefix
│ .prefix reset -> reset to .
╰──────────
${WATERMARK}`},{quoted:m});
    }
    if(["none","off","noprefix","no"].includes(newPref.toLowerCase())){
      updateSettings({prefix:""});
      return sock.sendMessage(m.key.remoteJid,{text:`*✅ Prefix Removed*\nBot now works *without prefix*\nExample: menu, ping\n${WATERMARK}`},{quoted:m});
    }
    if(newPref.toLowerCase()==="reset"){ updateSettings({prefix:"."}); return sock.sendMessage(m.key.remoteJid,{text:`*✅ Prefix Reset to .*\n${WATERMARK}`},{quoted:m}); }
    if(newPref.length>3) return sock.sendMessage(m.key.remoteJid,{text:`*❌ Max 3 characters*\nExample: ., !, /, #\n${WATERMARK}`},{quoted:m});
    updateSettings({prefix:newPref});
    await sock.sendMessage(m.key.remoteJid,{text:`*✅ Prefix Changed*\n\nNew Prefix: *${newPref}*\nExample: ${newPref}menu\n${WATERMARK}`},{quoted:m});
  }
};
