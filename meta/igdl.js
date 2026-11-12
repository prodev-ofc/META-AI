const { igdl } = require("ruhend-scraper");
const APIs = require('../lib/api')
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

function extractUniqueMedia(mediaData) {
  const uniqueMedia = [];
  const seenUrls = new Set();
  for (const media of mediaData) {
    if (!media.url) continue;
    if (!seenUrls.has(media.url)) {
      seenUrls.add(media.url);
      uniqueMedia.push(media);
    }
  }
  return uniqueMedia;
}

module.exports={
  name:"ig",
  react:"📸",
  alias:["instagram","insta","reel"],
  category:"download",
  desc:"Download Instagram post/reel via API",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const text = args.join(" ").trim() || m.message?.extendedTextMessage?.text || ""

    const url = text.match(/https?:\/\/[^\s]+instagram\.com[^\s]*/i)?.[0] || args[0]

    if(!url || !url.includes('instagram.com')){
      return sock.sendMessage(jid,{text:`❌ Provide valid IG link\n\nExample:\n.ig https://www.instagram.com/reel/xxxxx/\n\n${WATERMARK}`},{quoted:m})
    }

    try{
      await sock.sendMessage(jid,{react:{text:"🔄",key:m.key}})

      let mediaToDownload = []

      // TRY 1: Knight API (from lib/api.js) - most stable
      try{
        const { data } = await APIs.api.get(`${APIs.knightBase()}/api/download/instagram`,{
          params:{ apikey: APIs.knightKey(), url },
          timeout: 60000
        })
        if(data?.success && data?.result){
          const r = data.result
          const urls = r.video || r.download || r.url || r.medias || []
          if(Array.isArray(urls)) mediaToDownload = urls.map(u=>({url: typeof u==='string'?u:u.url, type: 'video'}))
          else if(typeof urls==='string') mediaToDownload = [{url: urls, type: 'video'}]
        }
      }catch(e){ console.log('[ig] Knight failed:', e.message) }

      // TRY 2: Fallback ruhend-scraper (your old method)
      if(!mediaToDownload.length){
        try{
          const downloadData = await igdl(url);
          if(downloadData?.data?.length){
            mediaToDownload = extractUniqueMedia(downloadData.data).slice(0,10)
          }
        }catch(e){ console.log('[ig] ruhend failed:', e.message) }
      }

      if(!mediaToDownload.length){
        return sock.sendMessage(jid,{text:`❌ No media found. Post might be private.\n\n${WATERMARK}`},{quoted:m})
      }

      for(let i=0;i<mediaToDownload.length;i++){
        const media = mediaToDownload[i]
        const mediaUrl = media.url
        if(!mediaUrl) continue
        const isVideo = /\.(mp4|mov)/i.test(mediaUrl) || media.type==='video' || url.includes('/reel/')

        if(isVideo){
          await sock.sendMessage(jid,{
            video:{url: mediaUrl},
            mimetype:"video/mp4",
            caption:`*📸 Instagram*\n\n${WATERMARK}`
          },{quoted:m})
        }else{
          await sock.sendMessage(jid,{
            image:{url: mediaUrl},
            caption:`*📸 Instagram*\n\n${WATERMARK}`
          },{quoted:m})
        }
        if(i < mediaToDownload.length-1) await new Promise(r=>setTimeout(r,800))
      }

      await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})

    }catch(e){
      console.log('[ig] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ IG failed: ${e.message}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
