const WATERMARK="> _\u2728\uFE0FMETA AI by \uD835\uDD95\uD835\uDD97\uD835\uDD94\uD835\uDC1D\uD835\uDC1E\uD835\uDC2F \uD835\uDD94\uD835\uDD8B\uD835\uDD8B\uD835\uDD8E\uD835\uDD8C\uD835\uDD8E\uD835\uDD86\uD835\uDD91\uD835\uDD8C_"
function norm(jid){ return jid.split('@')[0].split(':')[0] }

module.exports={
  name:"getpp",
  react:"\uD83D\uDDBC\uFE0F",
  alias:["pp","getprofile","profilepic"],
  category:"owner",
  desc:"Owner: Get profile picture",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    // OWNER ONLY CHECK
    const sender=m.key.participant || m.key.remoteJid
    const isFromMe=m.key.fromMe
    // change this to your number if you have ownerNumber set elsewhere
    const ownerNumbers=(global.ownerNumber ? [global.ownerNumber] : [])
    const isOwner=isFromMe || ownerNumbers.some(n=>sender.includes(n))

    if(!isOwner){
      await sock.sendMessage(jid,{react:{text:"\u274C",key:m.key}})
      return sock.sendMessage(jid,{text:`\u274C Owner only command\n\n${WATERMARK}`},{quoted:m})
    }

    await sock.sendMessage(jid,{react:{text:"\uD83D\uDC40",key:m.key}})

    let target=null
    const ctx=m.message?.extendedTextMessage?.contextInfo

    if(ctx?.participant) target=ctx.participant
    else if(ctx?.mentionedJid?.length) target=ctx.mentionedJid[0]
    else if(args[0]){
      const num=args[0].replace(/[^0-9]/g,'')
      if(num.length>=8) target=num+'@s.whatsapp.net'
    }else{
      if(jid.endsWith('@g.us')) target=jid
      else target=sender
    }

    if(!target){
      await sock.sendMessage(jid,{react:{text:"\u274C",key:m.key}})
      return sock.sendMessage(jid,{text:`Usage: .getpp @user / reply\n\n${WATERMARK}`},{quoted:m})
    }

    try{
      const ppUrl=await sock.profilePictureUrl(target,'image').catch(()=>sock.profilePictureUrl(target,'preview'))

      if(!ppUrl){
        await sock.sendMessage(jid,{react:{text:"\u274C",key:m.key}})
        return sock.sendMessage(jid,{text:`\u274C No PP for @${norm(target)}\n\n${WATERMARK}`, mentions:[target]},{quoted:m})
      }

      await sock.sendMessage(jid,{react:{text:"\u2705",key:m.key}})

      await sock.sendMessage(jid,{
        image:{url:ppUrl},
        caption:`*PP* @${norm(target)}\n\n${WATERMARK}`,
        mentions:[target]
      },{quoted:m})

    }catch(e){
      await sock.sendMessage(jid,{react:{text:"\u274C",key:m.key}})
      await sock.sendMessage(jid,{text:`\u274C Failed: No PP or private\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
