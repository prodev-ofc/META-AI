module.exports = {
  name: "image",
  alias: ["img","imagesearch","gimage","pinterest","pic"],
  category: "tools",
  desc: "Search and download images - .image Victoria Falls",
  react: "🖼️",
  execute: async (sock, m, args, { WATERMARK }) => {
    const query = args.join(" ").trim();
    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { text: `*🖼️ IMAGE SEARCH*\n\nUsage:\n.image Victoria Falls\n.img cats\n\n${WATERMARK}` }, { quoted: m });
    }
    const jid=m.key.remoteJid;
    try {
      await sock.sendMessage(jid, { react: { text: "🔍", key: m.key } });

      let imageUrls = [];

      // 1. TRY QWANT
      try {
        const qwantUrl = `https://api.qwant.com/v3/search/images?t=images&q=${encodeURIComponent(query)}&count=10&locale=en_US&uiv=4`;
        const res = await fetch(qwantUrl, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
        const data = await res.json();
        const items = data?.data?.result?.items || [];
        if (items.length) {
          imageUrls = items.map(i=>i.media_fullsize||i.media).filter(Boolean);
        }
      } catch(e){}

      // 2. TRY BING SCRAPER IF EMPTY
      if (imageUrls.length===0) {
        try {
          const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
          const res = await fetch(bingUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
          const html = await res.text();
          const regex = /"murl":"(https?:[^"]+?)"/g;
          let match;
          while ((match = regex.exec(html)) !== null) {
            let url = match[1].replace(/\\u002F/g,'/').replace(/\\/g,'');
            if (url.startsWith('http')) imageUrls.push(url);
            if (imageUrls.length>=10) break;
          }
        } catch(e){}
      }

      // 3. TRY DUCKDUCKGO vqd token
      if (imageUrls.length===0) {
        try {
          const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "Mozilla/5.0" } });
          const tokenHtml = await tokenRes.text();
          const vqdMatch = tokenHtml.match(/vqd=['"]([^'"]+)['"]/);
          if (vqdMatch) {
            const vqd = vqdMatch[1];
            const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
            const apiRes = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/" } });
            const apiData = await apiRes.json();
            if (apiData.results) {
              imageUrls = apiData.results.map(r=>r.image).filter(Boolean);
            }
          }
        } catch(e){}
      }

      if (!imageUrls.length) throw new Error("No images found");

      // Dedup
      imageUrls = [...new Set(imageUrls)].slice(0,5);

      let sent=0;
      for (let url of imageUrls) {
        try {
          // Validate url
          if(!url.startsWith('http')) continue;
          await sock.sendMessage(jid, {
            image: { url: url },
            caption: sent===0 ? `*🖼️ IMAGE: ${query.toUpperCase()}*\n\n📸 Found ${imageUrls.length} images\n${WATERMARK}` : undefined
          }, { quoted: m });
          sent++;
          if(sent>=5) break;
        } catch(err){ continue; }
      }

      if (sent===0) throw new Error("Failed to send images");

      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });

    } catch (e) {
      console.log("image error", e.message);
      await sock.sendMessage(jid, {
        text: `*🖼️ IMAGE: ${query}*\n\n❌ API blocked temporarily\n🌐 View on Google:\nhttps://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}\n\nTry: .image ${query} again\n${WATERMARK}`
      }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
    }
  }
};
