module.exports={
  name:"allcommands",
  alias:["allcmd"],
  category:"general",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    await sock.sendMessage(jid,{
      text:`*📋 ALL COMMANDS*\n\n*AI*\n.ai - Chat AI\n.ai /deepsearch - Zim AI\n\n*GENERAL*\n.menu - This menu\n.ping - Speed\n.owner - Dev info\n\n*OWNER*\n.mode - Change mode\n.setpp - Change pfp\n.setprefix - Change prefix\n\n> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_`,
      footer:"META AI",
      buttons:[
        {buttonId:".owner", buttonText:{displayText:"💻 Dev Info"}, type:1},
        {buttonId:".channel", buttonText:{displayText:"📢 Channel"}, type:1},
        {buttonId:".support", buttonText:{displayText:"💬 Support"}, type:1},
      ],
      headerType:1
    },{quoted:m})
  }
}
