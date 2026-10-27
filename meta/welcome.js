module.exports = {
  name: "welcome",
  init(sock){
    sock.ev.on('group-participants.update', async (a)=>{
      try{
        if(a.action==='add'){
          await sock.sendMessage(a.id, {text: `Welcome @${a.participants[0].split('@')[0]} to the group! 🎉`, mentions: a.participants})
        }
      }catch{}
    })
  },
  execute(){}
}
