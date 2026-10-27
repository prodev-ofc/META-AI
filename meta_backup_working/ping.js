module.exports={
  name:"ping",
  react:"🏓",
  category:"main",
  alias:["speed","p"],
  desc:"Check bot speed",
  execute: async (sock,m,args,{WATERMARK})=>{
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🏓",key:m.key}});
    const start=Date.now();
    await sock.sendMessage(m.key.remoteJid,{text:`🏓 Pong! ${Date.now()-start}ms ⚡\n\n${WATERMARK}`},{quoted:m});
  }
}
