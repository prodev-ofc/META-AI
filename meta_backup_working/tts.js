module.exports={
  name:"tts", react:"🔊", category:"ai", alias:["say","voice"], desc:"Text to voice",
  execute: async (sock,m,args)=>{
    const text=args.join(' ')
    if(!text) return await sock.sendMessage(m.key.remoteJid,{text:"*TTS* 🔊\n\nUse: .tts <text>\nEx: .tts Ndiyani akunetsa boe"}, {quoted:m})
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🔊",key:m.key}})
    try{
      const gtts=require('google-tts-api')
      const axios=require('axios')
      const isShona=/(ndiyani|boe|mannexy|arikunetsa|ndaka)/i.test(text)
      const lang=isShona?'en':'en'
      const url=gtts.getAudioUrl(text.slice(0,200),{lang, slow:false, host:'https://translate.google.com'})
      const res=await axios.get(url,{responseType:'arraybuffer'})
      await sock.sendMessage(m.key.remoteJid,{audio:Buffer.from(res.data), mimetype:'audio/mp4', ptt:true},{quoted:m})
    }catch(e){
      await sock.sendMessage(m.key.remoteJid,{text:"TTS failed 😅 "+e.message},{quoted:m})
    }
  }
}
