const fs=require('fs')
const path=require('path')

const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"

module.exports={
  name:"menu",
  react:"📜",
  alias:["help","list","commands"],
  category:"main",
  desc:"Show all commands automatically",
  execute: async (sock,m,args,{BOT_NAME,OWNER,commands})=>{
    await sock.sendMessage(m.key.remoteJid,{react:{text:"📜",key:m.key}});

    // Group by category automatically
    const grouped={}
    const seen=new Set()

    for(let [key,cmd] of commands){
      if(seen.has(cmd.name)) continue
      seen.add(cmd.name)
      const cat=(cmd.category||"other").toLowerCase()
      if(!grouped[cat]) grouped[cat]=[]
      grouped[cat].push(cmd)
    }

    // Build text
    let txt=`*┏━⪩ ${BOT_NAME} MENU ⪨━*\n*┃* By ${OWNER}\n*┃* Total: ${seen.size} cmds\n*┗━━━━━━━━━━━━━━*\n\n`

    // Sort categories: main first
    const order=["main","ai","tools","group","owner","download","fun","other"]
    const sortedCats=Object.keys(grouped).sort((a,b)=>{
      let ia=order.indexOf(a); let ib=order.indexOf(b);
      if(ia===-1) ia=999; if(ib===-1) ib=999;
      return ia-ib
    })

    for(let cat of sortedCats){
      txt+=`*╭─❏ ${cat.toUpperCase()} ❏*\n`
      for(let cmd of grouped[cat]){
        const aliases=cmd.alias ? ` (${cmd.alias.join(', ')})` : ""
        txt+=`*│ ◦* .${cmd.name}${aliases ? '' : ''}\n`
        // if you want desc: txt+=`│   └ ${cmd.desc||''}\n`
      }
      txt+=`*╰──────────*\n\n`
    }

    txt+=`${WATERMARK}`

    const imgPath="./media/menu.jpg"
    try{
      if(fs.existsSync(imgPath)){
        await sock.sendMessage(m.key.remoteJid,{image: fs.readFileSync(imgPath), caption: txt},{quoted:m});
      } else {
        await sock.sendMessage(m.key.remoteJid,{text: txt},{quoted:m});
      }
    }catch(e){
      await sock.sendMessage(m.key.remoteJid,{text: txt},{quoted:m});
    }
  }
}
