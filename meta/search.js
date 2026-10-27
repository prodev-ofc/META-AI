module.exports = {
  name: "search",
  alias: ["google","g","googlesearch","aisearch","s"],
  category: "tools",
  desc: "Google + AI web search - .search <query>",
  react: "🔍",
  execute: async (sock, m, args, { WATERMARK }) => {
    const query = args.join(" ").trim();
    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { text: `*🔍 GOOGLE + AI SEARCH*\n\nUsage:\n.search what is quantum computing\n.google meta ai bot\n\n${WATERMARK}` }, { quoted: m });
    }
    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } });

      // 1. DuckDuckGo + Wikipedia parallel
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1&no_html=1`;
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json&origin=*`;

      const [ddgRes, wikiRes] = await Promise.allSettled([
        fetch(ddgUrl).then(r=>r.json()),
        fetch(wikiUrl).then(r=>r.json())
      ]);

      let ddg = ddgRes.status==="fulfilled" ? ddgRes.value : null;
      let wiki = wikiRes.status==="fulfilled" ? wikiRes.value : null;

      let resultText = `╭────────────┉•┉\n│◊╭─◊ *[ 🔍 SEARCH: ${query.toUpperCase()} ]*\n`;

      if (ddg && ddg.AbstractText) {
        resultText += `│◊│ 📘 *AI Answer:*\n│◊│ ${ddg.AbstractText.slice(0,400)}\n│◊│\n`;
        if (ddg.AbstractURL) resultText += `│◊│ 🔗 ${ddg.AbstractURL}\n│◊│\n`;
      }

      if (wiki && wiki[1] && wiki[1].length) {
        resultText += `│◊│ 📚 *Top Results:*\n`;
        for (let i=0;i<Math.min(3,wiki[1].length);i++){
          resultText += `│◊│ ${i+1}. ${wiki[1][i]}\n│◊│    ${wiki[3][i]||''}\n`;
        }
        resultText += `│◊│\n`;
      }

      if (ddg && ddg.RelatedTopics && ddg.RelatedTopics.length) {
        resultText += `│◊│ 💡 *Related:*\n`;
        ddg.RelatedTopics.slice(0,3).forEach((t,i)=>{
          const txt = t.Text || t.Result || "";
          if(txt) resultText += `│◊│ • ${txt.slice(0,100)}\n`;
        });
      }

      if (resultText.includes("SEARCH")) {
        // Fallback if empty
        resultText += `│◊│ 🌐 *Google:* https://www.google.com/search?q=${encodeURIComponent(query)}\n│◊│\n`;
      }

      resultText += `│◊╰────────────┉•┉\n╰──────────────────┉\n\n${WATERMARK}`;

      await sock.sendMessage(m.key.remoteJid, { text: resultText }, { quoted: m });

    } catch (e) {
      console.log("search error", e);
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*🔍 SEARCH: ${query}*\n\n🌐 Google: https://www.google.com/search?q=${encodeURIComponent(query)}\n\n${WATERMARK}` 
      }, { quoted: m });
    }
  }
};
