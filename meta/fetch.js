const axios=require('axios')
const fs=require('fs')
const path=require('path')

function getExtFromUrl(url, contentType, content){
  if(url.includes('.js')) return '.js'
  if(url.includes('.json')) return '.json'
  if(url.includes('.py')) return '.py'
  if(url.includes('.html')) return '.html'
  if(url.includes('.css')) return '.css'
  if(url.includes('.ts')) return '.ts'
  const c=(content||'').slice(0,500)
  if(c.includes('module.exports') || c.includes('require(')) return '.js'
  if(c.trim().startsWith('{')) return '.json'
  if(c.includes('def ') && c.includes(':')) return '.py'
  if(c.includes('<html')) return '.html'
  return '.txt'
}
function getFileName(url, ext){
  try{
    const u=new URL(url)
    let name=path.basename(u.pathname)
    if(!name || name.length<2) name=`code${ext}`
    if(!name.includes('.')) name+=ext
    return name
  }catch{ return `code${ext}` }
}
function extractUrls(text){
  if(!text) return []
  const regex=/https?:\/\/[^\s\)\]\}]+/gi
  return text.match(regex)||[]
}

module.exports={
  name:"fetch", react:"🔗", category:"tools", alias:["getcode","fetchcode","dlcode"], desc:"Fetch link code as file (reply supported)",
  execute: async (sock,m,args)=>{
    // Get text from quoted message if reply
    const quotedText = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation 
      || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.caption
      || ""
    
    let url = args[0] || ""
    
    // If no arg, try extract from reply
    if(!url && quotedText){
      const urls = extractUrls(quotedText)
      if(urls.length>0) url=urls[0]
    }
    
    // If still no url, try extract from own message text
    if(!url){
      const ownText = m.message?.conversation || m.message?.extendedTextMessage?.text || ""
      const urls = extractUrls(ownText)
      // first url that is not the command itself
      if(urls.length>1) url=urls[1]
      else if(urls.length===1 && !urls[0].includes('.fetch')) url=urls[0]
    }

    if(!url){
      return await sock.sendMessage(m.key.remoteJid,{text:"*FETCH* 🔗\n\nUse:\n.fetch https://link\nOr reply to a message containing link with .fetch\n\nEx:\n.fetch https://raw.githubusercontent.com/user/repo/main/index.js\n\nSupported: GitHub raw, pastebin raw, gist, any code link"}, {quoted:m})
    }
    
    if(!url.startsWith('http')){
      await sock.sendMessage(m.key.remoteJid,{react:{text:"❌",key:m.key}})
      return await sock.sendMessage(m.key.remoteJid,{text:"❌ Invalid link"},{quoted:m})
    }
    
    await sock.sendMessage(m.key.remoteJid,{react:{text:"🔍",key:m.key}})
    try{ await sock.sendPresenceUpdate('composing', m.key.remoteJid) }catch{}
    
    try{
      let fetchUrl=url.replace(/\)+$/, '').replace(/\.+$/, '')
      if(fetchUrl.includes('pastebin.com/') && !fetchUrl.includes('/raw')){
        const id=fetchUrl.split('/').pop().split('?')[0]
        fetchUrl=`https://pastebin.com/raw/${id}`
      }
      if(fetchUrl.includes('github.com') && fetchUrl.includes('/blob/')){
        fetchUrl=fetchUrl.replace('github.com','raw.githubusercontent.com').replace('/blob/','/')
      }
      
      const res=await axios.get(fetchUrl,{
        responseType:'text',
        timeout:20000,
        headers:{'User-Agent':'Mozilla/5.0 Mozilla/5.0 (X11; Linux x86_64)'},
        maxContentLength: 3*1024*1024
      })
      
      const content=res.data
      if(!content || content.length<2){
        await sock.sendMessage(m.key.remoteJid,{react:{text:"❌",key:m.key}})
        return await sock.sendMessage(m.key.remoteJid,{text:"❌ Empty response"},{quoted:m})
      }
      if(content.length>200000){
        await sock.sendMessage(m.key.remoteJid,{react:{text:"⚠️",key:m.key}})
        return await sock.sendMessage(m.key.remoteJid,{text:`❌ File too large (${(content.length/1024).toFixed(1)}KB), max 200KB`},{quoted:m})
      }
      
      await sock.sendMessage(m.key.remoteJid,{react:{text:"⬇️",key:m.key}})
      
      const ext=getExtFromUrl(fetchUrl, res.headers['content-type'], content)
      const fileName=getFileName(fetchUrl, ext)
      const tmpDir=path.join(process.cwd(),'tmp')
      if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir,{recursive:true})
      const filePath=path.join(tmpDir, fileName)
      fs.writeFileSync(filePath, content)
      
      await sock.sendMessage(m.key.remoteJid,{
        document: fs.readFileSync(filePath),
        fileName: fileName,
        mimetype: ext==='.js'?'application/javascript': 'text/plain',
        caption: `*Fetched* ✅\n\n*URL:* ${url}\n*File:* ${fileName}\n*Size:* ${(content.length/1024).toFixed(2)} KB\n\n> _✨️Meta AI by prodev_`
      },{quoted:m})
      
      await sock.sendMessage(m.key.remoteJid,{react:{text:"✅",key:m.key}})
      
      if(content.length<3500){
        await sock.sendMessage(m.key.remoteJid,{text: `\`\`\`${ext.replace('.','')}\n${content.slice(0,3200)}\n\`\`\``},{quoted:m})
      }
      
      try{ fs.unlinkSync(filePath) }catch{}
      
    }catch(e){
      console.log("FETCH ERR", e.message)
      await sock.sendMessage(m.key.remoteJid,{react:{text:"❌",key:m.key}})
      let msg=e.message
      if(e.response?.status===404) msg="404 Not Found - use RAW link"
      if(e.response?.status===403) msg="403 Forbidden"
      await sock.sendMessage(m.key.remoteJid,{text:`❌ Fetch failed\n\n${msg}\n\nTip: Use raw link`},{quoted:m})
    }
  }
}
