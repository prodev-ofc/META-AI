const TIMEZONES = {
  "london":"Europe/London","uk":"Europe/London",
  "china":"Asia/Shanghai","beijing":"Asia/Shanghai",
  "japan":"Asia/Tokyo","tokyo":"Asia/Tokyo",
  "korea":"Asia/Seoul","seoul":"Asia/Seoul","south korea":"Asia/Seoul",
  "india":"Asia/Kolkata","delhi":"Asia/Kolkata",
  "australia":"Australia/Sydney","sydney":"Australia/Sydney",
  "russia":"Europe/Moscow","moscow":"Europe/Moscow",
  "zimbabwe":"Africa/Harare","harare":"Africa/Harare",
  "usa":"America/New_York","new york":"America/New_York",
  "dubai":"Asia/Dubai","germany":"Europe/Berlin","france":"Europe/Paris"
};
function cleanQuery(q){return q.toLowerCase().replace(/[^a-z0-9\s]/g,"").trim()}
function findTZ(query){
  if(!query) return "Africa/Harare";
  const q=cleanQuery(query);
  if(TIMEZONES[q]) return TIMEZONES[q];
  for(let k in TIMEZONES){ if(q.includes(k)||k.includes(q)) return TIMEZONES[k]; }
  try{ const all=Intl.supportedValuesOf('timeZone'); const hit=all.find(tz=>tz.toLowerCase().includes(q)); if(hit) return hit; }catch{}
  return null;
}
module.exports={
  name:"time",
  alias:["clock","now","t"],
  category:"tools",
  desc:"Time for any city - .time London / .time Japan",
  react:"⏰",
  execute: async(sock,m,args,{WATERMARK})=>{
    const input=args.join(" ").trim()||"Harare";
    const tz=findTZ(input)||"Africa/Harare";
    try{
      const now=new Date();
      const local=new Date(now.toLocaleString("en-US",{timeZone:tz}));
      const time12=local.toLocaleTimeString("en-US",{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true,timeZone:tz});
      const date=local.toLocaleDateString("en-GB",{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:tz});
      await sock.sendMessage(m.key.remoteJid,{text:`*⏰ TIME — ${input.toUpperCase()}*\n\n📅 ${date}\n⌚ ${time12}\n🌍 ${tz}\n${WATERMARK}`},{quoted:m});
    }catch(e){
      await sock.sendMessage(m.key.remoteJid,{text:`❌ Unknown location: ${input}\nTry: .time London, .time Japan\n${WATERMARK}`},{quoted:m});
    }
  }
};
