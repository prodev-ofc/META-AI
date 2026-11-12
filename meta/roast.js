const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

const roastOpeners = [
    "Uri munhu ane confidence yakawandisa,",
    "Mukoma, your brain yakamboenda kupi?",
    "Honestly, iwewe wakasiyana nevamwe,",
    "Ko iwe wakazvarwa wakadai here?",
    "Your intelligence iri pa holiday,",
    "Uri munhu anoda attention kunge WiFi,",
    "Handisi kukutuka but chokwadi ndechekuti,",
    "Your thinking speed yakaita seEconet network,",
    "Shamwari, ndakakutarisa ndikashaya words,",
    "Iwewe une talent yakasiyana,",
    "Uri kuita kunge munhu akarasika mu life,",
    "Your common sense yakatiza kare,",
    "Ko brain yako iri kushanda here?",
    "Uri munhu ane drama kupfuura ma soapies,",
    "Honestly, ma ideas ako anondishamisa,",
    "Iwewe unoda kudzidza kuti kufunga kunoitwa sei,",
    "Your personality ine problems dzakawanda,",
    "Uri kuita kunge phone isina network,",
    "Mukoma, even Google haigoni kukubatsira,",
    "Your confidence yakakura kupfuura intelligence yako,",
    "Iwewe wakaita kunge assignment isina answers,",
    "Uri munhu anogona kushatisa peaceful environment,",
    "Ko iwe unofunga usati wataura here?",
    "Your brain iri kuita maintenance,",
    "Shona yacho ndeyekuti uri munhu anonetsa,"
];

const roastPunchlines = [
    "because brain yako iri pa airplane mode.",
    "even mbudzi ine common sense kupfuura iwe.",
    "because ukanyarara ndipo panotanga peace.",
    "your brain needs a software update, zvakaoma.",
    "even calculator haigoni kuverenga mistakes dzako.",
    "unotaura zvakawanda asi hapana chinobuda.",
    "you are the reason vanhu vanoti patience is important.",
    "because kufunga kwacho kunenge kuri kubuffer.",
    "even Google Maps haigoni kuwana direction yeupenyu hwako.",
    "unotoda manual kuti vanhu vakunzwisise.",
    "your intelligence yakarara kubva last year.",
    "kana nonsense yaiva money, waizova billionaire.",
    "even your shadow dzimwe nguva inoda kukusiya.",
    "unongova noise with a human body.",
    "your common sense iri kuda kuendeswa kuchipatara.",
    "kana uri solution, problem yacho inowedzera.",
    "even alarm clock inoshanda kupfuura iwe.",
    "your brain ine storage yakazara nema excuses.",
    "unopedza oxygen asi hapana contribution.",
    "even mbuya vanogona kukupa life lessons.",
    "your logic iri kuita zvekutamba neinternet.",
    "kana silence iri gold, iwe uri debt.",
    "unongova walking notification yekusagadzikana.",
    "your ideas dzinoda kuenda kurepair shop.",
    "even munhu akarara anogona kufunga zviri nani."
];

const insults = [...new Set(roastOpeners.flatMap(o=>roastPunchlines.map(p=>`${o} ${p}`)))]

module.exports={
  name:"insult",
  react:"🔥",
  alias:["roast","shona-roast","tuka"],
  category:"fun",
  desc:"Shona-English roast",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const ctx=m.message?.extendedTextMessage?.contextInfo
    let userToInsult=null

    if(ctx?.mentionedJid?.length>0) userToInsult=ctx.mentionedJid[0]
    else if(ctx?.participant) userToInsult=ctx.participant

    if(!userToInsult){
      return sock.sendMessage(jid,{text:`😂 Mention munhu kana reply to their message kuti uvape roast!\n\nExample:\n.insult @user\nReply to message: .roast\n\n${WATERMARK}`},{quoted:m})
    }

    try{
      await sock.sendMessage(jid,{react:{text:"🔥",key:m.key}})
      const insult=insults[Math.floor(Math.random()*insults.length)]
      await new Promise(r=>setTimeout(r,600))

      await sock.sendMessage(jid,{
        text:`🔥 Hey @${userToInsult.split('@')[0]}, ${insult}\n\n${WATERMARK}`,
        mentions:[userToInsult]
      },{quoted:m})

    }catch(e){
      console.log('[insult] error:', e.message)
      await sock.sendMessage(jid,{text:`❌ Roast failed\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
