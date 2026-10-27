const fs=require('fs')
const os=require('os')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"

function getGreeting(){
  const h = new Date().getHours()
  if(h>=5 && h<12) return "☀️ *ɢᴏᴅ ᴍᴏʀɴɪɴɢ* 🌅"
  if(h>=12 && h<16) return "🌤️ *ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ* ☀️"
  if(h>=16 && h<20) return "🌇 *ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ* 🌙"
  return "🌙 *ɢᴏᴏᴅ ɴɪɢʜᴛ* ✨"
}
function formatUptime(){
  let sec = process.uptime()
  let d = Math.floor(sec/86400); sec%=86400
  let h = Math.floor(sec/3600); sec%=3600
  let m = Math.floor(sec/60)
  let s = Math.floor(sec%60)
  return `${d}d ${h}h ${m}m ${s}s`.replace(/^0d /,'')
}

module.exports={
  name:"menu",
  react:"📜",
  alias:["help","list","commands"],
  category:"main",
  desc:"Show all commands",
  execute: async (sock,m,args,{BOT_NAME,OWNER,PREFIX,commands})=>{
    try{ await sock.sendMessage(m.key.remoteJid,{react:{text:"📜",key:m.key}})}catch{}

    const pushName = m.pushName || m.pushName === "" ? m.pushName : (m.message?.extendedTextMessage?.contextInfo?.pushname || "User")
    const dayMood = getGreeting()
    const uptime = formatUptime()

    const grouped={}
    const seen=new Set()
    let totalWithAlias=0

    for(let [key,cmd] of commands){
      if(seen.has(cmd.name)) continue
      seen.add(cmd.name)
      const cat=(cmd.category||"other").toLowerCase()
      if(!grouped[cat]) grouped[cat]=[]
      grouped[cat].push(cmd)
      totalWithAlias += 1 + (cmd.alias ? cmd.alias.length : 0)
    }

    let txt=""
    txt+=`╭──────────────────┉\n`
    txt+=`│◊╭────────────┉•┉\n`
    txt+=`│◊ ⊢──• [  *🔵ᴍᴇᴛᴀ ᴀɪ ʙᴏᴛ🇿🇼* ]\n`
    txt+=`│◊│ \n`
    txt+=`│◊│ *_♤ HELLO: ${pushName}*\n`
    txt+=`│◊│\n`
    txt+=`│◊╰────────────┉•┉\n`
    txt+=`│ ${dayMood}\n`
    txt+=`╰──────────────────┉\n\n`

    txt+=`╭────────────┉•┉\n`
    txt+=`│◊╭─◊ *[ MAIN MENU ]*\n`
    txt+=`│◊ ⊢• *[ 🖥️ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ ]*\n`
    txt+=`│◊│ 🤖 \`ʙᴏᴛ\` : ${BOT_NAME||"META-AI"}\n`
    txt+=`│◊│ 👑 \`ᴏᴡɴᴇʀ\` : ${OWNER||"prodev zw"}\n`
    txt+=`│◊│ #️⃣ \`ᴘʀᴇғɪx\` : [${PREFIX||"."}]\n`
    txt+=`│◊│ 🌍 \`ORIGIN\` : Zimbabwe 🇿🇼\n`
    txt+=`│◊│ 🛰️ \`ᴜᴘᴛɪᴍᴇ\` : ${uptime}\n`
    txt+=`│◊│ ⚡ \`ᴍᴇᴍᴏʀʏ\` : ${(os.totalmem()/1024/1024/1024).toFixed(1)}GB / Multi-Device\n`
    txt+=`│◊╰────────────┉•┉\n`
    txt+=`╰──────────────────┉\n\n`

    txt+=`*┃* 🤖Total:  ${totalWithAlias} \n`
    txt+=`  *━━━━━━━━━━━━━━*\n\n`

    const order=["main","ai","tools","group","owner","download","info","fun","other"]
    const sortedCats=Object.keys(grouped).sort((a,b)=>{
      let ia=order.indexOf(a); let ib=order.indexOf(b);
      if(ia===-1) ia=999; if(ib===-1) ib=999;
      return ia-ib
    })

    for(let cat of sortedCats){
      txt+=`*╭─❏ ${cat.toUpperCase()} ❏*\n`
      for(let cmd of grouped[cat]){
        txt+=`*│ ◦* .${cmd.name}\n`
        if(cmd.alias && cmd.alias.length){
          for(let al of cmd.alias){
            txt+=`*│ ◦* .${al}\n`
          }
        }
      }
      txt+=`*╰──────────*\n\n`
    }
    txt+=`${WATERMARK}`

    const possiblePaths=["./media/menu.jpg","./assets/menu.jpg","./media/menu.png","./assets/menu.png"]
    const imgPath=possiblePaths.find(p=>fs.existsSync(p))

    if(imgPath){
      await sock.sendMessage(m.key.remoteJid,{image: fs.readFileSync(imgPath), caption: txt},{quoted:m})
    } else {
      await sock.sendMessage(m.key.remoteJid,{text: txt},{quoted:m})
    }
  }
}
