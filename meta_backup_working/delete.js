const fs=require('fs')
const path=require('path')
const CACHE_PATH=path.join(process.cwd(),'data/msgCache.json')

function loadCache(){ try{ if(!fs.existsSync(CACHE_PATH)) return {}; return JSON.parse(fs.readFileSync(CACHE_PATH)) }catch{ return {} } }
function saveCache(c){ try{ const dir=path.dirname(CACHE_PATH); if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(CACHE_PATH, JSON.stringify(c)) }catch{} }

function getQuotedKey(m){
  const ctx=m.message?.extendedTextMessage?.contextInfo
  if(!ctx?.stanzaId) return null
  return {
    remoteJid: m.key.remoteJid,
    id: ctx.stanzaId,
    participant: ctx.participant,
    fromMe: false
  }
}
function getMentionedJids(m){
  const ctx=m.message?.extendedTextMessage?.contextInfo
  return ctx?.mentionedJid || []
}

module.exports={
  name:"delete", react:"🗑️", category:"group", alias:["del","dlt"], desc:"Bulk delete up to 10",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    const isGroup=chatId.endsWith('@g.us')
    
    if(isGroup){
      try{
        const groupMeta=await sock.groupMetadata(chatId)
        const senderId=m.key.participant || m.key.remoteJid
        const isSenderAdmin=groupMeta.participants.some(p=>p.id===senderId && (p.admin))
        if(!isSenderAdmin){
          return await sock.sendMessage(chatId,{text:"❌ Admin only"}, {quoted:m})
        }
      }catch{}
    }

    const quotedKey=getQuotedKey(m)
    const mentioned=getMentionedJids(m)
    let count=1
    // parse number from args: .del 5 or .del 5 @user or .del @user 5
    for(const a of args){
      const n=parseInt(a)
      if(!isNaN(n)){ count=n; break }
    }
    if(count>10) count=10
    if(count<1) count=1

    if(!quotedKey && mentioned.length===0 && args.length===0){
      return await sock.sendMessage(chatId,{text:"*DELETE* 🗑️\n\nReply to msg:\n.del → delete 1\n.del 5 → delete last 5 of that user\n\nMention:\n.del @user 5 → delete 5 msgs of user\n\nMax 10"}, {quoted:m})
    }

    await sock.sendMessage(chatId,{react:{text:"🗑️",key:m.key}})

    try{
      const cache=loadCache()
      let deleted=0

      if(quotedKey){
        // 1. delete quoted first
        await sock.sendMessage(chatId,{delete:quotedKey})
        deleted++
        await new Promise(r=>setTimeout(r,300))

        // 2. if count>1, delete more from same participant from cache
        if(count>1){
          const target=quotedKey.participant
          let list=(cache[chatId]||[]).filter(x=>x.participant===target)
          // remove the one we just deleted (last)
          list=list.slice(0,-1).slice(-(count-1)).reverse()
          for(const obj of list){
            try{
              await sock.sendMessage(chatId,{delete: obj.key})
              deleted++
              await new Promise(r=>setTimeout(r,400))
            }catch(e){ console.log("bulk del fail", e.message) }
          }
        }

        await sock.sendMessage(chatId,{react:{text:"✅",key:m.key}})
        try{ await sock.sendMessage(chatId,{delete:m.key}) }catch{}
        await sock.sendMessage(chatId,{text:`✅ Deleted ${deleted}/${count}`, mentions:[]},{quoted:m})
        return
      }

      if(mentioned.length>0){
        const target=mentioned[0]
        let list=(cache[chatId]||[]).filter(x=>x.participant===target).slice(-count).reverse()
        if(list.length===0){
          await sock.sendMessage(chatId,{react:{text:"❌",key:m.key}})
          return await sock.sendMessage(chatId,{text:`❌ No cached messages for @${target.split('@')[0]} yet. Bot needs to see ${count} messages from them first. Try replying to their msg with .del ${count}`, mentions:[target]}, {quoted:m})
        }
        for(const obj of list){
          try{
            await sock.sendMessage(chatId,{delete: obj.key})
            deleted++
            await new Promise(r=>setTimeout(r,400))
          }catch{}
        }
        await sock.sendMessage(chatId,{react:{text:"✅",key:m.key}})
        try{ await sock.sendMessage(chatId,{delete:m.key}) }catch{}
        await sock.sendMessage(chatId,{text:`✅ Deleted ${deleted}/${count} of @${target.split('@')[0]}`, mentions:[target]})
        return
      }

      // .del 5 alone without reply -> delete last N bot messages / any
      if(!isNaN(parseInt(args[0])) && !quotedKey){
        let list=(cache[chatId]||[]).slice(-count).reverse()
        for(const obj of list){
          try{
            await sock.sendMessage(chatId,{delete: obj.key})
            deleted++
            await new Promise(r=>setTimeout(r,400))
          }catch{}
        }
        await sock.sendMessage(chatId,{react:{text:"✅",key:m.key}})
        await sock.sendMessage(chatId,{text:`✅ Deleted ${deleted} recent messages`})
      }

    }catch(e){
      await sock.sendMessage(chatId,{react:{text:"❌",key:m.key}})
      await sock.sendMessage(chatId,{text:`❌ Failed: ${e.message}`},{quoted:m})
    }
  },

  logMessage: (chatId, key, participant)=>{
    try{
      const cache=loadCache()
      if(!cache[chatId]) cache[chatId]=[]
      cache[chatId].push({key, participant, time:Date.now()})
      if(cache[chatId].length>200) cache[chatId]=cache[chatId].slice(-200)
      saveCache(cache)
    }catch{}
  }
}
