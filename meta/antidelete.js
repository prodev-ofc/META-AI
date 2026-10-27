module.exports = {
  name: "antidelete",
  init(sock){
    sock.ev.on('messages.delete', async (m)=>{
      try{
        if(!m.keys) return
        for(const k of m.keys){
          await sock.sendMessage(k.remoteJid, {text: `🚫 ANTIDELETE: Message deleted detected!`})
        }
      }catch{}
    })
  },
  execute(){}
}
