const TIMEZONES = {
  "london":"Europe/London","uk":"Europe/London","england":"Europe/London",
  "china":"Asia/Shanghai","beijing":"Asia/Shanghai","shanghai":"Asia/Shanghai",
  "japan":"Asia/Tokyo","tokyo":"Asia/Tokyo",
  "korea":"Asia/Seoul","seoul":"Asia/Seoul","south korea":"Asia/Seoul","southkorea":"Asia/Seoul",
  "india":"Asia/Kolkata","delhi":"Asia/Kolkata","mumbai":"Asia/Kolkata","kolkata":"Asia/Kolkata",
  "australia":"Australia/Sydney","sydney":"Australia/Sydney","melbourne":"Australia/Melbourne",
  "russia":"Europe/Moscow","moscow":"Europe/Moscow",
  "usa":"America/New_York","america":"America/New_York","new york":"America/New_York","us":"America/New_York",
  "canada":"America/Toronto","toronto":"America/Toronto",
  "zimbabwe":"Africa/Harare","harare":"Africa/Harare","zim":"Africa/Harare",
  "south africa":"Africa/Johannesburg","johannesburg":"Africa/Johannesburg","capetown":"Africa/Johannesburg",
  "nigeria":"Africa/Lagos","lagos":"Africa/Lagos",
  "dubai":"Asia/Dubai","uae":"Asia/Dubai","saudi":"Asia/Riyadh","riyadh":"Asia/Riyadh",
  "germany":"Europe/Berlin","berlin":"Europe/Berlin",
  "france":"Europe/Paris","paris":"Europe/Paris",
  "italy":"Europe/Rome","rome":"Europe/Rome",
  "spain":"Europe/Madrid","madrid":"Europe/Madrid",
  "brazil":"America/Sao_Paulo","sao paulo":"America/Sao_Paulo",
  "singapore":"Asia/Singapore","malaysia":"Asia/Kuala_Lumpur",
  "indonesia":"Asia/Jakarta","jakarta":"Asia/Jakarta",
  "philippines":"Asia/Manila","manila":"Asia/Manila",
  "thailand":"Asia/Bangkok","bangkok":"Asia/Bangkok",
  "turkey":"Europe/Istanbul","istanbul":"Europe/Istanbul",
  "egypt":"Africa/Cairo","cairo":"Africa/Cairo",
};

function cleanQuery(q){
  return q.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/🇿🇼|🇨🇳|🇦🇺|🇷🇺|🇮🇳|🇰🇷|🇯🇵|🇬🇧|🇺🇸|🇿🇦|🇳🇬|🇦🇪|🇩🇪|🇫🇷|🇮🇹|🇪🇸|🇧🇷|🇸🇬|🇲🇾|🇮🇩|🇵🇭|🇹🇭|🇹🇷|🇪🇬/g,"").trim()
}
function findTZ(query){
  if(!query) return "Africa/Harare";
  const q = cleanQuery(query);
  if(TIMEZONES[q]) return TIMEZONES[q];
  // partial match
  for(let k in TIMEZONES){ if(q.includes(k) || k.includes(q)) return TIMEZONES[k]; }
  // search IANA list
  try{
    const all = Intl.supportedValuesOf('timeZone');
    const hit = all.find(tz => tz.toLowerCase().includes(q) || q.includes(tz.split('/').pop().toLowerCase()));
    if(hit) return hit;
  }catch{}
  return null;
}

module.exports={
  name:"date",
  alias:["today","calendar","d"],
  category:"tools",
  desc:"Date for any city/country - .date London / .date China",
  react:"📅",
  execute: async(sock,m,args,{WATERMARK})=>{
    const input = args.join(" ").trim() || "Harare";
    const tz = findTZ(input) || "Africa/Harare";
    const now = new Date();

    let harareTime;
    try{
      harareTime = new Date(now.toLocaleString("en-US",{timeZone:tz}));
    }catch(e){
      return sock.sendMessage(m.key.remoteJid,{text:`❌ Unknown location: *${input}*\nTry: .date London, .date Japan, .date Australia\n${WATERMARK}`},{quoted:m});
    }

    const dayName = harareTime.toLocaleDateString("en-US",{weekday:'long',timeZone:tz});
    const dateStr = harareTime.toLocaleDateString("en-GB",{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:tz});
    const time12 = harareTime.toLocaleTimeString("en-US",{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true,timeZone:tz});
    const time24 = harareTime.toLocaleTimeString("en-GB",{hour12:false,timeZone:tz});
    const offset = harareTime.toLocaleTimeString("en-US",{timeZoneName:'short',timeZone:tz}).split(' ').pop();

    const greetH = harareTime.getHours();
    const greet = greetH<12?"🌅 Good Morning":greetH<16?"☀️ Good Afternoon":greetH<20?"🌇 Good Evening":"🌙 Good Night";

    const txt=`╭────────────┉•┉
│◊╭─◊ *[ 📅 ${input.toUpperCase()} ]*
│◊│ ${greet}
│◊│
│◊│ 📆 *Date:* ${dateStr}
│◊│ ⏰ *Time:* ${time12} (${time24})
│◊│ 🌍 *Timezone:* ${tz}
│◊│ 🕒 *Zone:* ${offset}
│◊│ 📍 *Location:* ${input}
│◊╰────────────┉•┉
╰──────────────────┉

> ${WATERMARK}`;
    await sock.sendMessage(m.key.remoteJid,{text:txt},{quoted:m});
  }
};
