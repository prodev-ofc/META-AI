const APIs = require('../lib/api');
const axios = require('axios');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

async function google(q){
  try{
    const r = await axios.get(`https://api.siputzx.my.id/api/s/google?query=${encodeURIComponent(q + " Zimbabwe 2025 2026")}`, {timeout:12000})
    return r.data?.data || []
  }catch{ return [] }
}

async function directAI(prompt){
  const urls=[
    `https://api.siputzx.my.id/api/ai/gpt4?prompt=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/deepseek?prompt=${encodeURIComponent(prompt)}`,
  ]
  for(const u of urls){
    try{
      const r=await axios.get(u,{timeout:25000})
      const a=r.data?.data||r.data?.result
      if(a && a.length>40) return a
    }catch{}
  }
  return null
}

async function knightAI(query){
  const steps=[
    ()=>APIs.knightChatAI(query),
    ()=>APIs.knightGptAI(query),
    ()=>APIs.fallbackChatAI(query),
  ]
  for(const run of steps){
    try{ const a=await run(); if(a && a.length>10) return a }catch(e){ console.log('[ai knight]',e.message) }
  }
  return null
}

const ZIM_CTX = `ZIM 2025-2026: Hip-Hop GOAT=Holy Ten (Mukudzei Chitsama, Ndaremerwa) vs Voltz JT (Nkosilathi Sibiya, Mukoma Brian). NOT Killer T (Zimdancehall), NOT Nasty C (SA). Hulengende=Ezbornwage Chidamajaya, Fadza Madzimai #1, Zunza Mupunduru #1, MalloNgende with Malloti. Jnr Spragga=Nyasha Dedza, DAKA, MaRulez, got $300k Sept 2026 from Scott Sakupwanya (Travo+$50k+Rick Ross collab) + Wicknell (house $150k+$50k). Hulengende vs Spragga = biggest Zimdancehall rivalry 2026. Biggest overall: Jah Prayzah, Winky D.`

module.exports={
  name:"ai",
  react:"🤖",
  alias:["gpt","gemini","llama","deepsearch"],
  category:"ai",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const raw=args.join(' ').trim() || m.message?.extendedTextMessage?.text?.replace(/^\.ai\s*/i,'').trim()
    if(!raw) return sock.sendMessage(jid,{text:`*AI* 🤖\n\n.ai <question>\n.ai /deepsearch <question>\n\n${WATERMARK}`},{quoted:m})
    const isDeep=/deepsearch|nuke/i.test(raw)
    const query=raw.replace(/\/deepsearch|deepsearch|nuke/gi,'').trim()
    try{
      await sock.sendMessage(jid,{react:{text:"🤖",key:m.key}})
      try{ await sock.sendPresenceUpdate('composing', jid) }catch{}
      const isZim=/zim|zimbabwe|hulengende|spragga|goat|hip-hop|hiphop|dancehall|who is|biggest|right now/i.test(query)||isDeep

      await sock.sendMessage(jid,{text:`🔍 Searching both AIs... ⏳\n\n${WATERMARK}`},{quoted:m})

      let sources=[]
      if(isZim || isDeep) sources = await google(query)
      const searchCtx = sources.length ? `\nLIVE SEARCH 2025-2026:\n` + sources.slice(0,4).map((x,i)=>`${i+1}. ${x.title} - ${x.snippet||x.description||''}`).join('\n') : ""

      const knightPromise = knightAI(query)
      const directPrompt = isZim
        ? `You are META AI, Zim expert. Never say Oct 2023 / no info. Use facts:\n${ZIM_CTX}\n${searchCtx}\n\nQuestion: ${query}\nAnswer WhatsApp style, short, punchy.`
        : `${query}\n${searchCtx}`
      const directPromise = directAI(directPrompt)

      const [knightAns, directAns] = await Promise.all([knightPromise, directPromise])

      // === BOTH FAILED = only time we send failure ===
      if(!knightAns && !directAns){
        return sock.sendMessage(jid,{text:`❌ Both AIs failed rn 😅 try again\n\n${WATERMARK}`},{quoted:m})
      }

      // === Send only what succeeded, silently skip failed one ===
      if(knightAns){
        await sock.sendMessage(jid,{text:`*🤖 Ai Chat - Knight AI*\n\n*📝 ${query}*\n\n${knightAns}\n\n${WATERMARK}`},{quoted:m})
      }
      // No else - don't send "Knight failed" if Direct worked

      if(directAns){
        if(knightAns) await new Promise(r=>setTimeout(r,800))
        let out = `*🤖 Ai Chat - Deepsearch AI*\n\n*📝 ${query}*\n\n${directAns}\n\n`
        if(sources.length) out += `*🔍 Sources:*\n` + sources.slice(0,3).map(s=>`• ${s.link}`).join('\n') + `\n\n`
        out += WATERMARK
        await sock.sendMessage(jid,{text:out},{quoted:m})
      }
      // No else - don't send "Deepsearch failed" if Knight worked

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
    }catch(e){
      console.error('[ai]',e)
      await sock.sendMessage(jid,{text:`❌ AI down rn 😅 try again\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
