// ==================================================
//  XPRO ZLI - WEATHER - EXACT REPLICA LAYOUT
//  Created by XPRO-TECH by PRODEV ZW
//  API: Open-Meteo (free, no key)
// ==================================================
const axios = require('axios');

const WATERMARK = "> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_";

// Zim towns - so .weather Mutare / Gweru / etc always finds correct place
const ZIM_CITIES = {
  "harare": "Harare, Zimbabwe", "bulawayo": "Bulawayo, Zimbabwe",
  "chinhoyi": "Chinhoyi, Zimbabwe", "mutare": "Mutare, Zimbabwe",
  "gweru": "Gweru, Zimbabwe", "masvingo": "Masvingo, Zimbabwe",
  "kwekwe": "Kwekwe, Zimbabwe", "kadoma": "Kadoma, Zimbabwe",
  "marondera": "Marondera, Zimbabwe", "bindura": "Bindura, Zimbabwe",
  "beitbridge": "Beitbridge, Zimbabwe", "victoria falls": "Victoria Falls, Zimbabwe",
  "vic falls": "Victoria Falls, Zimbabwe", "hwange": "Hwange, Zimbabwe",
  "rusape": "Rusape, Zimbabwe", "chiredzi": "Chiredzi, Zimbabwe",
  "karoi": "Karoi, Zimbabwe", "chegutu": "Chegutu, Zimbabwe",
  "norton": "Norton, Zimbabwe", "ruwa": "Ruwa, Zimbabwe",
  "chitungwiza": "Chitungwiza, Zimbabwe", "epworth": "Epworth, Zimbabwe",
  "kariba": "Kariba, Zimbabwe", "chipinge": "Chipinge, Zimbabwe",
  "gwanda": "Gwanda, Zimbabwe", "plumtree": "Plumtree, Zimbabwe",
  "shurugwi": "Shurugwi, Zimbabwe", "zvishavane": "Zvishavane, Zimbabwe",
  "redcliff": "Redcliff, Zimbabwe", "nyanga": "Nyanga, Zimbabwe",
  "chimanimani": "Chimanimani, Zimbabwe", "mutoko": "Mutoko, Zimbabwe",
  "murewa": "Murewa, Zimbabwe", "mazowe": "Mazowe, Zimbabwe"
};

function wmo(code){
  if(code === 0) return "☀️ Clear Sky";
  if(code === 1) return "🌤️ Mainly Clear";
  if(code === 2) return "⛅ Partly Cloudy";
  if(code === 3) return "☁️ Overcast";
  if(code === 45 || code === 48) return "🌫️ Foggy";
  if(code === 51) return "🌦️ Light Drizzle";
  if(code === 53) return "🌦️ Moderate Drizzle";
  if(code === 55) return "🌦️ Dense Drizzle";
  if(code === 56 || code === 57) return "🌦️ Freezing Drizzle";
  if(code === 61) return "🌧️ Slight Rain";
  if(code === 63) return "🌧️ Moderate Rain";
  if(code === 65) return "🌧️ Heavy Rain";
  if(code === 66 || code === 67) return "🌧️ Freezing Rain";
  if(code === 71 || code === 73 || code === 75 || code === 77) return "🌨️ Snow";
  if(code === 80) return "🌧️ Slight Showers";
  if(code === 81) return "🌧️ Moderate Showers";
  if(code === 82) return "🌧️ Violent Showers";
  if(code === 85 || code === 86) return "🌨️ Snow Showers";
  if(code === 95) return "⛈️ Thunderstorm";
  if(code === 96 || code === 99) return "⛈️ Thunderstorm with Hail";
  return "🌤️ Partly Cloudy";
}
function windDir(deg){
  const dirs = ["North","North-East","East","South-East","South","South-West","West","North-West"];
  return dirs[Math.round(deg / 45) % 8];
}
function fmtDate(iso){
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", month: "short", day: "numeric" });
}
function fmtDay(iso){
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

module.exports = {
  name: "weather",
  react: "🌍",
  alias: ["w", "forecast", "mumamiriro"],
  category: "tools",
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    let city = args.join(" ").trim() || (m.message?.extendedTextMessage?.text || "").replace(/^\.(weather|w|forecast|mumamiriro)\s*/i, "").trim();
    if(!city) return sock.sendMessage(jid, { text: `🌍 *XPRO WEATHER SERVICE*\n\nUsage: *.weather Chinhoyi*\n*.weather Harare*\n*.weather Mutare*\n\n${WATERMARK}` }, { quoted: m });

    const key = city.toLowerCase().replace(/,.*$/, "").trim();
    const searchCity = ZIM_CITIES[key] || (/zimbabwe/i.test(city) ? city : `${city}, Zimbabwe`);

    try{
      await sock.sendMessage(jid, { react: { text: "🌍", key: m.key } });

      // === MSG 1 - EXACT SAME AS SCREENSHOT ===
      await sock.sendMessage(jid, { text: `🌍 *XPRO WEATHER SERVICE*\n\n🔎 Checking weather for *${city}*...` }, { quoted: m });

      const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search", { params: { name: searchCity, count: 1, language: "en", format: "json" }, timeout: 15000 });
      const place = geo.data?.results?.[0];
      if(!place) return sock.sendMessage(jid, { text: `❌ Could not find *${city}*. Try *.weather Harare*\n\n${WATERMARK}` }, { quoted: m });

      const wx = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: place.latitude, longitude: place.longitude,
          current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day",
          daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset",
          timezone: "auto", forecast_days: 3
        }, timeout: 15000
      });

      const cur = wx.data.current;
      const daily = wx.data.daily;
      const tz = wx.data.timezone || "Africa/Harare";
      const now = new Date().toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
      const isDay = cur.is_day === 1 ? "🌞 Daytime" : "🌙 Nighttime";

      // === MSG 2 - EXACT SAME LAYOUT AS SCREENSHOT ===
      let out = ` ╭━━━━━━━━━━━━━━━━━━╮\n      🌍 *XPRO- WEATHER*\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;
      out += `📍 *LOCATION*\n${place.name}, ${place.admin1 || ""}, ${place.country || "Zimbabwe"}\n\n`;
      out += `🕒 *Local Time:* ${now}\n${isDay}\n\n`;
      out += `━━━━━━━━━━━━━━━━━━\n🌡️ *CURRENT CONDITIONS*\n━━━━━━━━━━━━━━━━━━\n\n`;
      out += `🌦️ *Weather:* ${wmo(cur.weather_code)}\n\n`;
      out += `🌡️ *Temperature:* ${cur.temperature_2m}°C\n`;
      out += `🤔 *Feels Like:* ${cur.apparent_temperature}°C\n`;
      out += `💧 *Humidity:* ${cur.relative_humidity_2m}%\n`;
      out += `☁️ *Cloud Cover:* ${cur.cloud_cover}%\n\n`;
      out += `🌧️ *Precipitation:* ${cur.precipitation} mm\n`;
      out += `🌦️ *Rain:* ${cur.rain} mm\n`;
      out += `🌧️ *Showers:* ${cur.showers} mm\n\n`;
      out += `💨 *Wind Speed:* ${cur.wind_speed_10m} km/h\n`;
      out += `🧭 *Wind Direction:* ${windDir(cur.wind_direction_10m)}\n`;
      out += `🌪️ *Wind Gusts:* ${cur.wind_gusts_10m} km/h\n\n`;
      out += `🔵 *Pressure:* ${cur.pressure_msl} hPa\n\n`;
      out += `━━━━━━━━━━━━━━━━━━\n📅 *3-DAY FORECAST*\n━━━━━━━━━━━━━━━━━━\n\n`;

      const labels = ["📌 *TODAY*", "📆 *TOMORROW*", "📆 *UPCOMING DAY*"];
      for(let i = 0; i < 3; i++){
        const sunrise = daily.sunrise[i] ? daily.sunrise[i].split("T")[1] : "-";
        const sunset = daily.sunset[i] ? daily.sunset[i].split("T")[1] : "-";
        out += `${labels[i]}\n🗓️ ${fmtDay(daily.time[i])}\n\n`;
        out += `${wmo(daily.weather_code[i])}\n\n`;
        out += `🌡️ High: ${daily.temperature_2m_max[i]}°C\n`;
        out += `🥶 Low: ${daily.temperature_2m_min[i]}°C\n`;
        out += `🌧️ Rain Chance: ${daily.precipitation_probability_max[i] ?? 0}%\n`;
        out += `☀️ UV Index: ${daily.uv_index_max[i]}\n`;
        if(i === 0){
          out += `🌅 Sunrise: ${sunrise}\n`;
          out += `🌇 Sunset: ${sunset}\n`;
        }
        out += `\n`;
      }

      out += `━━━━━━━━━━━━━━━━━━\n📡 *DATA PROVIDER*\nOpen-Meteo\n\n`;
      out += `> ✨ Powered by *prodev ofc*\n> 🤖 *XPRO-TECH Weather System*`;

      await sock.sendMessage(jid, { text: out }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });

    }catch(e){
      console.error("[weather]", e.message);
      await sock.sendMessage(jid, { text: `❌ Weather failed rn 😅 try again\n\n${WATERMARK}` }, { quoted: m });
    }
  }
};
