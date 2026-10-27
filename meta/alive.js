module.exports={
  name:"alive",
  react:"👑",
  category:"main",
  alias:["bot","online"],
  desc:"Check if bot is alive",
  execute: async (sock,m,args,{BOT_NAME,WATERMARK})=>{
    await sock.sendMessage(m.key.remoteJid,{react:{text:"👑",key:m.key}});
    await sock.sendMessage(m.key.remoteJid,{text:`*${BOT_NAME} IS ALIVE* 🔥\n\n✅ PM2: Online\n📦 Auto Menu: Enabled\n\n${WATERMARK}`},{quoted:m});
  }
}
