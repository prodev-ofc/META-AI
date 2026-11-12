const isAdmin = require('../lib/isAdmin');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

module.exports={
  name:"kick",
  react:"🦶",
  alias:["remove","kik"],
  category:"group",
  desc:"Kick user from group",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const senderId=m.key.participant || m.key.remoteJid
    if(!jid.endsWith('@g.us')) return sock.sendMessage(jid,{text:`Group only\n\n${WATERMARK}`},{quoted:m})

    const isOwner = m.key.fromMe
    if(!isOwner){
      const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, jid, senderId)
      if(!isBotAdmin) return sock.sendMessage(jid,{text:`Bot must be admin first.\n\n${WATERMARK}`},{quoted:m})
      if(!isSenderAdmin) return sock.sendMessage(jid,{text:`Only group admins can use .kick\n\n${WATERMARK}`},{quoted:m})
    }

    let usersToKick=[]
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant

    if(mentioned.length>0) usersToKick=mentioned
    else if(quotedParticipant) usersToKick=[quotedParticipant]

    if(usersToKick.length===0){
      return sock.sendMessage(jid,{text:`Mention or reply to kick!\n\nEx: .kick @user\nReply: .kick\n\n${WATERMARK}`},{quoted:m})
    }

    const botId = sock.user?.id || ''
    const botLid = sock.user?.lid || ''
    const botPhoneNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId)
    const botIdFormatted = botPhoneNumber + '@s.whatsapp.net'
    const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid)
    const botLidWithoutSuffix = botLid.includes('@') ? botLid.split('@')[0] : botLid

    const metadata = await sock.groupMetadata(jid)
    const participants = metadata.participants || []

    const isTryingToKickBot = usersToKick.some(userId => {
      const userPhoneNumber = userId.includes(':') ? userId.split(':')[0] : (userId.includes('@') ? userId.split('@')[0] : userId)
      const userLidNumeric = userId.includes('@lid') ? userId.split('@')[0].split(':')[0] : ''
      const directMatch = (userId===botId || userId===botLid || userId===botIdFormatted || userPhoneNumber===botPhoneNumber || (userLidNumeric && botLidNumeric && userLidNumeric===botLidNumeric))
      if(directMatch) return true
      return participants.some(p=>{
        const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : ''
        const pId = p.id ? p.id.split('@')[0] : ''
        const pLid = p.lid ? p.lid.split('@')[0] : ''
        const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid
        const isThisParticipantBot = (p.id===botId || p.lid===botLid || pLidNumeric===botLidNumeric || pPhoneNumber===botPhoneNumber || pId===botPhoneNumber || p.phoneNumber===botIdFormatted || (botLid && pLid && botLidWithoutSuffix===pLid))
        if(isThisParticipantBot){
          return (userId===p.id || userId===p.lid || userPhoneNumber===pPhoneNumber || userPhoneNumber===pId || userId===p.phoneNumber || (pLid && userLidNumeric && userLidNumeric===pLidNumeric))
        }
        return false
      })
    })

    if(isTryingToKickBot){
      return sock.sendMessage(jid,{text:`I can't kick myself 🤖\n\n${WATERMARK}`},{quoted:m})
    }

    try{
      await sock.groupParticipantsUpdate(jid, usersToKick, "remove")
      const usernames = usersToKick.map(j=>`@${j.split('@')[0]}`).join(', ')
      await sock.sendMessage(jid,{text:`${usernames} kicked successfully! ✅\n\n${WATERMARK}`, mentions:usersToKick},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
    }catch(e){
      console.log('[kick] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Failed to kick: ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
