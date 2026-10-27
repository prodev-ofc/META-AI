const axios = require('axios')
const WATERMARK="> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"

async function apkSearch(query){
  const apis = [
    `https://api.davidcyriltech.my.id/search/apk?text=${encodeURIComponent(query)}`,
    `https://api.akuari.my.id/search/apk?query=${encodeURIComponent(query)}`
  ]
  for(const api of apis){
    try{
      const {data} = await axios.get(api, {timeout:15000})
      const list = data.result || data.data || []
      if(Array.isArray(list) && list.length>0) return list[0]
      if(list && list.name) return list
    }catch(e){ console.log("SEARCH FAIL", e.message) }
  }
  return null
}

async function apkDl(searchRes, query){
  // davidcyriltech needs id
  const id = searchRes.id || searchRes.link || searchRes.url || query
  const apis = [
    `https://api.davidcyriltech.my.id/download/apk?id=${encodeURIComponent(id)}`,
    `https://api.akuari.my.id/download/apk?id=${encodeURIComponent(id)}`,
    `https://api.ryzendesu.vip/api/downloader/apk?id=${encodeURIComponent(id)}`
  ]
  // if searchRes already has direct dl
  if(searchRes.download_url || searchRes.download || searchRes.link?.endsWith('.apk')){
    return { url: searchRes.download_url || searchRes.download || searchRes.link, info: searchRes }
  }
  for(const api of apis){
    try{
      const {data} = await axios.get(api, {timeout:30000})
      const dl = data.result?.download || data.result?.download_url || data.result?.url || data.download_url
      const info = data.result || searchRes
      if(dl) return { url: dl, info }
    }catch(e){ console.log("DL FAIL", api, e.message) }
  }
  return null
}

module.exports={
  name:"apk",
  react:"📦",
  alias:["app","apkdl","playstore"],
  category:"download",
  async execute(sock,m,args){
    const jid=m.key.remoteJid
    if(!args[0]) return sock.sendMessage(jid,{text:`*╭┈───〔 META-AI APK 〕┈───⊷*\n*├• Example:* .apk whatsapp\n*├• .apk facebook lite\n*├• .apk tiktok\n*├• .apk capcut\n*╰───────────────────⊷*\n\n${WATERMARK}`},{quoted:m})
    await sock.sendMessage(jid,{react:{text:"🔍",key:m.key}})
    const query=args.join(" ")
    try{
      const search = await apkSearch(query)
      if(!search) return sock.sendMessage(jid,{text:`❌ App not found: *${query}*\nTry full name\n\n${WATERMARK}`},{quoted:m})
      
      const name = search.name || search.appName || query
      const version = search.version || search.lastVersion || "-"
      const size = search.size || "-"
      const dev = search.developer || search.publisher || "-"
      const icon = search.icon || search.thumbnail || "https://i.imgur.com/3g7nmJC.png"

      const caption=`*╭┈───〔 META-AI APK 〕┈───⊷*\n*├• 📦 Name:* ${name}\n*├• 🔢 Version:* ${version}\n*├• 📏 Size:* ${size}\n*├• 👨‍💻 Dev:* ${dev}\n*╰───────────────────⊷*\n\n${WATERMARK}\n\n*_downloading.._*`
      
      await sock.sendMessage(jid,{image:{url:icon},caption},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"⬇️",key:m.key}})

      const result = await apkDl(search, query)
      if(!result) throw new Error("Download link not found")

      console.log("APK DL URL:", result.url)

      const res = await axios.get(result.url, {
        responseType:'arraybuffer',
        timeout: 300000,
        maxContentLength: 1024*1024*500,
        headers:{ 'User-Agent':'Mozilla/5.0' }
      })
      const buffer = Buffer.from(res.data)
      const mb = (buffer.length / (1024*1024)).toFixed(2)

      await sock.sendMessage(jid,{
        document: buffer,
        mimetype: "application/vnd.android.package-archive",
        fileName: `${name.replace(/[^a-z0-9]/gi,'_')}.apk`,
        caption: `*╭┈───〔 📦 APK DONE 〕┈───⊷*\n*├• 📦 Name:* ${name}\n*├• 🔢 Version:* ${version}\n*├• 📏 Size:* ${mb} MB\n*╰───────────────────⊷*\n\n${WATERMARK}`
      },{quoted:m})

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
    }catch(e){
      console.log(e)
      await sock.sendMessage(jid,{text:`❌ APK Failed: ${e.message}\n\n${WATERMARK}`},{quoted:m})
      await sock.sendMessage(jid,{react:{text:"❌",key:m.key}})
    }
  }
}
