const fs = require('fs')
const path = require('path')
const axios = require('axios')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
const DB_PATH = path.join(__dirname, '..', 'database', 'welcome.json')
if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
if(!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({enabled:true}))

let initialized=false
let JimpLib
try{ JimpLib = require('jimp').Jimp }catch{ JimpLib = require('jimp') }

async function getPP(sock, jid){
  try{
    const url = await sock.profilePictureUrl(jid, 'image')
    const res = await axios.get(url, {responseType:'arraybuffer'})
    return Buffer.from(res.data)
  }catch{ return null }
}

async function makeCard(ppBuf, username, type){
  const W=800, H=900
  // new jimp 1.x syntax
  const img = new JimpLib({width:W, height:H, color:'#0a0a0a'})
  
  const font64 = await JimpLib.loadFont(JimpLib.FONT_SANS_64_WHITE).catch(()=>null)
  const font32 = await JimpLib.loadFont(JimpLib.FONT_SANS_32_WHITE).catch(()=>null)

  // TOP TEXT - GOODBYE RED / WELCOME GREEN
  if(font64){
    // create two text layers to color them
    const t1 = new JimpLib({width:W, height:80, color:'#0a0a0a'})
    t1.print({font:font64, x:0, y:0, text:{text:'GOODBYE /', alignmentX:'center'}, maxWidth:W})
    t1.scan((x,y,idx)=>{ if(t1.bitmap.data[idx+3]>10){ t1.bitmap.data[idx]=255; t1.bitmap.data[idx+1]=0; t1.bitmap.data[idx+2]=0 } })
    img.composite(t1,0,20)

    const t2 = new JimpLib({width:W, height:80, color:'#0a0a0a'})
    t2.print({font:font64, x:0, y:0, text:'WELCOME', alignmentX:'center'}, W)
    t2.scan((x,y,idx)=>{ if(t2.bitmap.data[idx+3]>10){ t2.bitmap.data[idx]=0; t2.bitmap.data[idx+1]=255; t2.bitmap.data[idx+2]=80 } })
    img.composite(t2,0,90)
  }

  // LEFT META AI CYAN
  if(font32){
    const left = new JimpLib({width:120, height:300, color:'#0a0a0a'})
    left.print({font:font32, x:0, y:0, text:'META\nAI'})
    left.scan((x,y,idx)=>{ if(left.bitmap.data[idx+3]>10){ left.bitmap.data[idx]=0; left.bitmap.data[idx+1]=255; left.bitmap.data[idx+2]=255 } })
    img.composite(left,15,320)
    
    const right = new JimpLib({width:150, height:300, color:'#0a0a0a'})
    right.print({font:font32, x:0, y:0, text:'WhatsApp\nBoT'})
    img.composite(right,W-130,320)
  }

  // CENTER BOX WHITE ROUNDED + CIRCLED PFP
  const boxSize=400
  const box = new JimpLib({width:boxSize, height:boxSize, color:'#ffffff'})
  
  let pfp
  if(ppBuf){
    try{ pfp = await JimpLib.read(ppBuf) }catch{ pfp=null }
  }
  if(!pfp){
    pfp = new JimpLib({width:400, height:400, color:'#25D366'})
  }
  pfp.resize({w:360, h:360})
  pfp.circle()

  box.composite(pfp,20,20)
  img.composite(box, (W-boxSize)/2, 240)

  // BOTTOM USERNAME GREEN
  if(font32){
    const bottom = new JimpLib({width:W, height:60, color:'#0a0a0a'})
    bottom.print({font:font32, x:0, y:0, text:{text:username, alignmentX:'center'}, maxWidth:W})
    bottom.scan((x,y,idx)=>{ if(bottom.bitmap.data[idx+3]>10){ bottom.bitmap.data[idx]=0; bottom.bitmap.data[idx+1]=255; bottom.bitmap.data[idx+2]=80 } })
    img.composite(bottom,0,H-80)
  }

  const out = path.join(__dirname, `../tmp/${type}_${Date.now()}.png`)
  if(!fs.existsSync(path.dirname(out))) fs.mkdirSync(path.dirname(out),{recursive:true})
  await img.write(out)
  return out
}

function initWelcome(sock){
  if(initialized) return
  initialized=true
  sock.ev.on('group-participants.update', async (anu)=>{
    try{
      const db = JSON.parse(fs.readFileSync(DB_PATH))
      if(!db.enabled) return
      const {id, participants, action} = anu
      if(!['add','remove'].includes(action)) return
      for(const user of participants){
        const username = user.split('@')[0]
        const pp = await getPP(sock, user)
        const type = action==='add' ? 'welcome' : 'goodbye'
        const card = await makeCard(pp, username, type)
        const caption = action==='add'
        ? `*╭┈───〔 👋 WELCOME 〕┈───⊷*\n*├• 👤 User:* @${username}\n*├• 🆔 ID:* ${username}\n*╰───────────────────⊷*\n\n${WATERMARK}`
        : `*╭┈───〔 👋 GOODBYE 〕┈───⊷*\n*├• 👤 User:* @${username}\n*├• 🆔 ID:* ${username}\n*╰───────────────────⊷*\n\n${WATERMARK}`
        await sock.sendMessage(id, {image: fs.readFileSync(card), caption, mentions:[user]})
        fs.unlinkSync(card)
      }
    }catch(e){ console.log("WELCOME ERR", e.message) }
  })
}

module.exports={ name:"welcome", alias:["wel"], category:"group", init:initWelcome,
  async execute(sock,m,args){
    initWelcome(sock)
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`Group only\n\n${WATERMARK}`},{quoted:m})
    const db=JSON.parse(fs.readFileSync(DB_PATH))
    const cmd=(args[0]||'').toLowerCase()
    if(!cmd) return sock.sendMessage(jid,{text:`*╭┈───〔 👋 WELCOME 〕┈───⊷*\n*├• Status:* ${db.enabled?'ON ✅':'OFF ❌'}\n*├• .welcome on / off\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    if(cmd==='on'){ db.enabled=true; fs.writeFileSync(DB_PATH, JSON.stringify(db)); return sock.sendMessage(jid,{text:`*╭┈───〔 👋 WELCOME 〕┈───⊷*\n*├• ✅ Enabled\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m}) }
    if(cmd==='off'){ db.enabled=false; fs.writeFileSync(DB_PATH, JSON.stringify(db)); return sock.sendMessage(jid,{text:`*╭┈───〔 👋 WELCOME 〕┈───⊷*\n*├• ❌ Disabled\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m}) }
  }
}
