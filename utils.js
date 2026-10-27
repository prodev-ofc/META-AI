module.exports = {
  box: (cfg, lines=[]) => {
    const botName = cfg.botName || "META AI"
    // your current box
    let txt = `*╭─── ${botName} ───*\n`
    for(const l of lines){
      txt += `*│* ${l}\n`
    }
    txt += `*╰──────────────*\n\n${cfg.watermark}`
    return txt
  }
}
