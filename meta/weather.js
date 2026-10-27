module.exports={
  name:"weather",
  alias:["wea","wet","w"],
  category:"tools",
  desc:"Weather for any city/country - .weather London / .weather Russia",
  react:"🌤️",
  execute: async(sock,m,args,{WATERMARK})=>{
    const input=args.join(" ").trim();
    if(!input){
      return sock.sendMessage(m.key.remoteJid,{text:`*🌤️ WEATHER*\n\nUsage:\n.weather Harare\n.weather London\n.weather Australia\n.weather Russia\n.weather Japan\n.weather India\n\n${WATERMARK}`},{quoted:m});
    }
    const city = input.replace(/[^a-zA-Z0-9\s\-]/g,"").trim();
    try{
      await sock.sendMessage(m.key.remoteJid,{react:{text:"⏳",key:m.key}});
      const res=await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      if(!res.ok) throw new Error("API failed");
      const data=await res.json();
      const cur=data.current_condition?.[0];
      const area=data.nearest_area?.[0];
      if(!cur) throw new Error("No data");
      
      const location = `${area?.areaName?.[0]?.value||city}, ${area?.country?.[0]?.value||""}`.replace(/,\s*$/,'');
      const tempC=cur.temp_C, tempF=cur.temp_F;
      const feelsC=cur.FeelsLikeC, humidity=cur.humidity, windK=cur.windspeedKmph, windDir=cur.winddir16Point;
      const desc=cur.weatherDesc?.[0]?.value||"";
      const cloud=cur.cloudcover, vis=cur.visibility, uv=cur.uvIndex;

      const txt=`╭────────────┉•┉
│◊╭─◊ *[ 🌤️ ${location.toUpperCase()} ]*
│◊│ ${desc}
│◊│
│◊│ 🌡️ *Temp:* ${tempC}°C / ${tempF}°F
│◊│ 🤔 *Feels:* ${feelsC}°C
│◊│ 💧 *Humidity:* ${humidity}%
│◊│ 💨 *Wind:* ${windK} km/h ${windDir}
│◊│ ☁️ *Cloud:* ${cloud}%
│◊│ 👁️ *Visibility:* ${vis} km
│◊│ 🔆 *UV Index:* ${uv}
│◊│ 📍 *Query:* ${input}
│◊╰────────────┉•┉
╰──────────────────┉

${WATERMARK}`;
      await sock.sendMessage(m.key.remoteJid,{text:txt},{quoted:m});
      await sock.sendMessage(m.key.remoteJid,{react:{text:"✅",key:m.key}});
    }catch(e){
      console.log("weather error",e);
      await sock.sendMessage(m.key.remoteJid,{text:`❌ Could not get weather for *${input}*\nCheck spelling and try again.\nExample: .weather London\n${WATERMARK}`},{quoted:m});
    }
  }
};
