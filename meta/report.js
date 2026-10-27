module.exports = {
  name: "report",
  alias: ["rep"],
  category: "owner",
  desc: "Report + Ban (Owner Only)",
  async execute(sock, m, args, commands){
    const cfg = require('../config')
    const { box } = require('../utils')
    const isGroup = m.key.remoteJid.endsWith('@g.us')

    function getRealSender(msg){
      return msg.key.senderPn || msg.key.participantPn || msg.key.remoteJidAlt || msg.key.participantAlt || msg.key.participant || msg.key.remoteJid || ""
    }

    // --- OWNER CHECK FIXED FOR LID ---
    const realSender = getRealSender(m)
    const realSenderNum = realSender.replace(/\D/g,'').slice(-10) // last 10 digits
    const owners = Array.isArray(cfg.owner) ? cfg.owner : [cfg.owner]
    
    console.log("Owner check - RealSender:", realSender, "Num:", realSenderNum, "Owners:", owners)
    
    const isOwner = owners.some(o => {
      const ownerNum = o.replace(/\D/g,'').slice(-10)
      return realSender.includes(o) || realSenderNum.includes(ownerNum) || ownerNum.includes(realSenderNum) || m.key.fromMe
    }) || m.key.fromMe

    if(!isOwner){
      return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`❌ Owner only`, `Your ID: ${realSender}`, `Real num: ${realSenderNum}`]) }, { quoted: m })
    }

    if(!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Usage: ${cfg.prefix}report <1-5> @user <reason>`]) }, { quoted: m })

    let count = parseInt(args[0])
    if(isNaN(count)){ count = 1 } else { args.shift() }
    if(count > 5) count = 5
    if(count < 1) count = 1

    let targetJid = null
    if(m.message.extendedTextMessage?.contextInfo?.participant){
      targetJid = m.message.extendedTextMessage.contextInfo.participant
    } else if(m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length){
      targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
    } else if(args[0]){
      const num = args[0].replace(/[^0-9]/g,'')
      if(num.length >= 10){ targetJid = num + "@s.whatsapp.net"; args.shift() }
    }
    if(!targetJid) return await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`❌ Reply or mention user`]) }, { quoted: m })

    const targetNum = targetJid.split('@')[0]
    const reason = args.join(' ') || "Spam / Scam"
    const sent = await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Reporting ${count}x...`, `User: @${targetNum}`, `Reason: ${reason}`]), mentions:[targetJid] }, { quoted: m })

    let success = 0
    for(let i=1;i<=count;i++){
      try{
        await sock.updateBlockStatus(targetJid, "block").catch(()=>{})
        await sock.updateBlockStatus(targetJid, "unblock").catch(()=>{})
        if(sock.sendNode){
          await sock.sendNode({
            tag: "iq",
            attrs: { to: "@s.whatsapp.net", type: "set", xmlns: "w:report" },
            content: [{ tag: "report", attrs: { jid: targetJid, reason } }]
          }).catch(()=>{})
        }
        success++
        await sock.sendMessage(m.key.remoteJid, { text: box(cfg, [`Reporting... [${i}/${count}]`, `User: @${targetNum}`, `Success: ${success}`]), edit: sent.key, mentions:[targetJid] }).catch(()=>{})
        await new Promise(r=>setTimeout(r,1000))
      }catch{}
    }

    let banStatus = ""
    try{
      if(isGroup){
        const metadata = await sock.groupMetadata(m.key.remoteJid)
        const botNum = cfg.botNumber.replace(/\D/g,'').slice(-10)
        const botParticipant = metadata.participants.find(p => {
          const idNum = (p.id + (p.lid||'') + (p.phoneNumber||'')).replace(/\D/g,'').slice(-10)
          return idNum.includes(botNum)
        })
        const isBotAdmin = botParticipant && botParticipant.admin !== null
        if(isBotAdmin){
          await sock.groupParticipantsUpdate(m.key.remoteJid, [targetJid], "remove")
          banStatus = "✅ Removed from group"
        } else {
          banStatus = "⚠️ Bot not admin"
          await sock.updateBlockStatus(targetJid, "block")
        }
      } else {
        await sock.updateBlockStatus(targetJid, "block")
        banStatus = "✅ Blocked"
      }
    }catch(e){ banStatus = `❌ ${e.message}` }

    const finalText = box(cfg, [`REPORT + BAN DONE`, `User: @${targetNum}`, `Reports: ${success}/${count}`, `Reason: ${reason}`, `Ban: ${banStatus}`])
    await sock.sendMessage(m.key.remoteJid, { text: finalText, edit: sent.key, mentions:[targetJid] })
  }
}
