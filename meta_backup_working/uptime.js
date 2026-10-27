module.exports={
  name:"uptime", react:"⏱️", category:"info", alias:["up","runtime","botup"], desc:"Show bot uptime",
  execute: async (sock,m,args)=>{
    const format = (sec)=>{
      const d=Math.floor(sec/86400)
      const h=Math.floor((sec%86400)/3600)
      const m=Math.floor((sec%3600)/60)
      const s=Math.floor(sec%60)
      let out=[]
      if(d) out.push(`${d}d`)
      if(h) out.push(`${h}h`)
      if(m) out.push(`${m}m`)
      out.push(`${s}s`)
      return out.join(' ')
    }

    const botUptime=process.uptime()
    const os=require('os')
    const hostUptime=os.uptime()

    const used=(process.memoryUsage().heapUsed/1024/1024).toFixed(2)
    const total=(os.totalmem()/1024/1024/1024).toFixed(2)

    await sock.sendMessage(m.key.remoteJid,{react:{text:"⏱️",key:m.key}})

    const text=`*⏱️ META-AI UPTIME*

*Bot:* ${format(botUptime)}
*Host:* ${format(hostUptime)}

*Stats:*
• Memory: ${used} MB / ${total} GB
• Platform: ${os.platform()} ${os.arch()}
• Started: ${new Date(Date.now()-botUptime*1000).toLocaleString()}

> _✨️Meta AI by prodev_`

    await sock.sendMessage(m.key.remoteJid,{text},{quoted:m})
  }
}
