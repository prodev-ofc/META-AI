const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { isWelcomeOn, getWelcome } = require('../lib/index')
const { lidToMention } = require('../lib/jidHelper')
const { handleWelcome } = require('../lib/welcome')

const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"
const DB_PATH = path.join(__dirname, '..', 'database', 'welcome.json')
if(!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), {recursive:true})
if(!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({enabled:true}))

let initialized=false
let JimpLib
try{ JimpLib = require('jimp').Jimp }catch{ JimpLib = require('jimp') }

function resolveParticipantIds(participant) {
  if (typeof participant === 'string') return [participant];
  if (!participant || typeof participant !== 'object') return [String(participant)];
  return [participant.phoneNumber, participant.jid, participant.id, participant.lid].filter(Boolean);
}

async function getPP(sock, jid){
  try{
    const url = await sock.profilePictureUrl(jid, 'image')
    const res = await axios.get(url, {responseType:'arraybuffer'})
    return Buffer.from(res.data)
  }catch{ return null }
}

async function makeCard(ppBuf, username, type){
  const W=800, H=900
  const img = new JimpLib({width:W, height:H, color:'#0a0a0a'})
  const font64 = await JimpLib.loadFont(JimpLib.FONT_SANS_64_WHITE).catch(()=>null)
  const font32 = await JimpLib.loadFont(JimpLib.FONT_SANS_32_WHITE).catch(()=>null)

  if(font64){
    const t1 = new JimpLib({width:W, height:80, color:'#0a0a0a'})
    t1.print({font:font64, x:0, y:0, text:{text: type==='welcome' ? 'WELCOME' : 'GOODBYE /', alignmentX:'center'}, maxWidth:W})
    t1.scan((x,y,idx)=>{ if(t1.bitmap.data[idx+3]>10){ t1.bitmap.data[idx]= type==='welcome' ? 0 : 255; t1.bitmap.data[idx+1]= type==='welcome' ? 255 : 0; t1.bitmap.data[idx+2]= type==='welcome' ? 80 : 0 } })
    img.composite(t1,0,20)

    if(type==='welcome'){
      const t2 = new JimpLib({width:W, height:80, color:'#0a0a0a'})
      t2.print({font:font64, x:0, y:0, text:'META-AI', alignmentX:'center'}, W)
      img.composite(t2,0,90)
    } else {
      const t2 = new JimpLib({width:W, height:80, color:'#0a0a0a'})
      t2.print({font:font64, x:0, y:0, text:{text:'WELCOME', alignmentX:'center'}, maxWidth:W})
      t2.scan((x,y,idx)=>{ if(t2.bitmap.data[idx+3]>10){ t2.bitmap.data[idx]=0; t2.bitmap.data[idx+1]=255; t2.bitmap.data[idx+2]=80 } })
      img.composite(t2,0,90)
    }
  }

  if(font32){
    const left = new JimpLib({width:120, height:300, color:'#0a0a0a'})
    left.print({font:font32, x:0, y:0, text:'META\nAI'})
    left.scan((x,y,idx)=>{ if(left.bitmap.data[idx+3]>10){ left.bitmap.data[idx]=0; left.bitmap.data[idx+1]=255; left.bitmap.data[idx+2]=255 } })
    img.composite(left,15,320)

    const right = new JimpLib({width:150, height:300, color:'#0a0a0a'})
    right.print({font:font32, x:0, y:0, text:'WhatsApp\nBoT'})
    img.composite(right,W-130,320)
  }

  const boxSize=400
  const box = new JimpLib({width:boxSize, height:boxSize, color:'#ffffff'})
  let pfp
  if(ppBuf){ try{ pfp = await JimpLib.read(ppBuf) }catch{ pfp=null } }
  if(!pfp) pfp = new JimpLib({width:400, height:400, color:'#25D366'})
  pfp.resize({w:360, h:360})
  pfp.circle()
  box.composite(pfp,20,20)
  img.composite(box, (W-boxSize)/2, 240)

  if(font32){
    const bottom = new JimpLib({width:W, height:60, color:'#0a0a0a'})
    bottom.print({font:font32, x:0, y:0, text:{text:username, alignmentX:'center'}, maxWidth:W})
    bottom.scan((x,y,idx)=>{ if(bottom.bitmap.data[idx+3]>10){ bottom.bitmap.data[idx]=0; bottom.bitmap.data[idx+1]=255; bottom.bitmap.data[idx+2]=80 } })
    img.composite(bottom,0,H-80)
  }

  const out = path.join(__dirname, `../tmp/${type}_${Date.now()}_${Math.random().toString(36).slice(2)}.png`)
  if(!fs.existsSync(path.dirname(out))) fs.mkdirSync(path.dirname(out),{recursive:true})
  await img.write(out)
  return out
}

function initWelcome(sock){
  if(initialized) return
  initialized=true
  sock.ev.on('group-participants.update', async (anu)=>{
    try{
      const {id, participants, action} = anu
      if(!['add','remove'].includes(action)) return

      // Check both DBs: your old lib/index + new local DB
      const localDb = JSON.parse(fs.readFileSync(DB_PATH))
      if(!localDb.enabled) return
      const isWelcomeEnabled = await isWelcomeOn(id)
      if(!isWelcomeEnabled) return

      const customMessage = await getWelcome(id)
      const groupMetadata = await sock.groupMetadata(id)
      const groupName = groupMetadata.subject
      const groupDesc = groupMetadata.desc || 'No description available'

      for(const participant of participants){
        try{
          const ids = resolveParticipantIds(participant)
          let metaParticipant = null
          try{
            const fresh = await sock.groupMetadata(id)
            metaParticipant = fresh.participants.find((p) =>
              ids.some((cand) =>
                [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean).some(
                  (x) => String(x).split('@')[0].split(':')[0] === String(cand).split('@')[0].split(':')[0]
                )
              )
            )
          }catch{}

          const mention = lidToMention([metaParticipant?.phoneNumber, metaParticipant?.id, metaParticipant?.lid, ...ids])
          const mentionJid = mention.jid || ids[0]
          const displayName = mention.number || (mentionJid ? mentionJid.split('@')[0] : 'user')
          const mentionTag = `@${displayName}`
          const mentions = mention.mentions.length ? mention.mentions : (mentionJid ? [mentionJid] : [])

          let finalMessage
          if(customMessage){
            finalMessage = customMessage.replace(/{user}/g, mentionTag).replace(/{group}/g, groupName).replace(/{description}/g, groupDesc)
          } else {
            const now = new Date()
            const timeString = now.toLocaleString('en-US', {month:'2-digit',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})
            finalMessage = action==='add'
              ? `╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: ${mentionTag} 👋\n┃Count: #${groupMetadata.participants.length}\n┃𝚃𝙸𝙼𝙴: ${timeString}⏰\n╰━━━━━━━━━━━━━━━╯\n\n*${mentionTag}* Welcome to *${groupName}*! 🎉\n${groupDesc}\n\n${WATERMARK}`
              : `╭╼━≪•𝙻𝙴𝙵𝚃•≫━╾╮\n┃𝙶𝙾𝙾𝙳𝙱𝚈𝙴: ${mentionTag} 👋\n┃Time: ${timeString}\n╰━━━━━━━━━━━━━━━╯\n\n${WATERMARK}`
          }

          // Generate JIMP card
          try{
            const pp = await getPP(sock, mentionJid)
            const card = await makeCard(pp, displayName, action==='add'?'welcome':'goodbye')
            await sock.sendMessage(id, {image: fs.readFileSync(card), caption: finalMessage, mentions})
            fs.unlinkSync(card)
          }catch{
            // fallback text only
            await sock.sendMessage(id, {text: finalMessage, mentions})
          }

        }catch(e){ console.log("WELCOME PARTICIPANT ERR", e.message) }
      }
    }catch(e){ console.log("WELCOME ERR", e.message) }
  })
}

module.exports={
  name:"welcome",
  alias:["wel","setwelcome"],
  category:"group",
  init:initWelcome,
  execute: async (sock,m,args)=>{
    initWelcome(sock)
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`Group only\n\n${WATERMARK}`},{quoted:m})

    // Old Knight Bot custom welcome handler: .welcome <message> or .welcome delete
    if(args.length>0 && !['on','off','enable','disable'].includes(args[0].toLowerCase())){
      const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
      const matchText = text.split(' ').slice(1).join(' ')
      return await handleWelcome(sock, jid, m, matchText)
    }

    const db=JSON.parse(fs.readFileSync(DB_PATH))
    const cmd=(args[0]||'').toLowerCase()
    if(!cmd) return sock.sendMessage(jid,{text:`*╭┈───〔 👋 WELCOME 〕┈───⊷*\n*├• Status:* ${db.enabled?'ON ✅':'OFF ❌'}\n*├• .welcome on / off\n*├• .welcome <custom msg>\n*├• Use {user} {group} {description}\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    if(cmd==='on' || cmd==='enable'){ db.enabled=true; fs.writeFileSync(DB_PATH, JSON.stringify(db)); return sock.sendMessage(jid,{text:`✅ Welcome Enabled\n\n${WATERMARK}`},{quoted:m}) }
    if(cmd==='off' || cmd==='disable'){ db.enabled=false; fs.writeFileSync(DB_PATH, JSON.stringify(db)); return sock.sendMessage(jid,{text:`❌ Welcome Disabled\n\n${WATERMARK}`},{quoted:m}) }
  }
}
