// ==================================================
//  XPRO ZLI - WORLD CLOCK SYSTEM
//  Converted from XPRO-MD plugins/tools/time.js
//  Created by XPRO-TECH by PRODEV ZW
//  API: None - Uses Intl.DateTimeFormat (built-in)
// ==================================================
const WATERMARK = "> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_";

const DEFAULT_ZONE = 'Africa/Harare';

const popularZones = {
  harare: 'Africa/Harare',
  zimbabwe: 'Africa/Harare',
  zambia: 'Africa/Lusaka',
  lusaka: 'Africa/Lusaka',
  southafrica: 'Africa/Johannesburg',
  johannesburg: 'Africa/Johannesburg',
  nigeria: 'Africa/Lagos',
  lagos: 'Africa/Lagos',
  kenya: 'Africa/Nairobi',
  nairobi: 'Africa/Nairobi',
  egypt: 'Africa/Cairo',
  cairo: 'Africa/Cairo',
  ethiopia: 'Africa/Addis_Ababa',
  ghana: 'Africa/Accra',
  tanzania: 'Africa/Dar_es_Salaam',
  uganda: 'Africa/Kampala',
  botswana: 'Africa/Gaborone',
  mozambique: 'Africa/Maputo',
  malawi: 'Africa/Blantyre',
  namibia: 'Africa/Windhoek',
  angola: 'Africa/Luanda',
  london: 'Europe/London',
  uk: 'Europe/London',
  paris: 'Europe/Paris',
  germany: 'Europe/Berlin',
  berlin: 'Europe/Berlin',
  moscow: 'Europe/Moscow',
  dubai: 'Asia/Dubai',
  india: 'Asia/Kolkata',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  pakistan: 'Asia/Karachi',
  china: 'Asia/Shanghai',
  shanghai: 'Asia/Shanghai',
  japan: 'Asia/Tokyo',
  tokyo: 'Asia/Tokyo',
  korea: 'Asia/Seoul',
  seoul: 'Asia/Seoul',
  singapore: 'Asia/Singapore',
  thailand: 'Asia/Bangkok',
  bangkok: 'Asia/Bangkok',
  indonesia: 'Asia/Jakarta',
  australia: 'Australia/Sydney',
  sydney: 'Australia/Sydney',
  perth: 'Australia/Perth',
  'new york': 'America/New_York',
  'newyork': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'losangeles': 'America/Los_Angeles',
  chicago: 'America/Chicago',
  canada: 'America/Toronto',
  toronto: 'America/Toronto',
  brazil: 'America/Sao_Paulo',
  mexico: 'America/Mexico_City',
  'new zealand': 'Pacific/Auckland',
  'newzealand': 'Pacific/Auckland',
  hawaii: 'Pacific/Honolulu',
  utc: 'UTC'
};

const clocks = [
  ['🇿🇼', 'Harare', 'Africa/Harare'],
  ['🇬🇧', 'London', 'Europe/London'],
  ['🇺🇸', 'New York', 'America/New_York'],
  ['🇺🇸', 'Los Angeles', 'America/Los_Angeles'],
  ['🇿🇦', 'Johannesburg', 'Africa/Johannesburg'],
  ['🇳🇬', 'Lagos', 'Africa/Lagos'],
  ['🇦🇪', 'Dubai', 'Asia/Dubai'],
  ['🇮🇳', 'New Delhi', 'Asia/Kolkata'],
  ['🇯🇵', 'Tokyo', 'Asia/Tokyo'],
  ['🇨🇳', 'Shanghai', 'Asia/Shanghai'],
  ['🇸🇬', 'Singapore', 'Asia/Singapore'],
  ['🇦🇺', 'Sydney', 'Australia/Sydney'],
  ['🇧🇷', 'Sao Paulo', 'America/Sao_Paulo'],
  ['🇨🇦', 'Toronto', 'America/Toronto'],
  ['🇳🇿', 'Auckland', 'Pacific/Auckland'],
  ['🌍', 'UTC', 'UTC']
];

function resolveZone(input){
  const value = String(input || '').trim();
  if(!value) return DEFAULT_ZONE;
  const normalized = value.toLowerCase();
  if(popularZones[normalized]) return popularZones[normalized];
  // Allow direct IANA timezone identifiers
  try{
    const formatter = new Intl.DateTimeFormat('en', { timeZone: value });
    return formatter.resolvedOptions().timeZone;
  }catch{ return null; }
}

function getTimeData(zone){
  const now = new Date();
  const dateOptions = { timeZone: zone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
  const hourOptions = { timeZone: zone, hour: '2-digit', hourCycle: 'h23' };
  const offsetOptions = { timeZone: zone, timeZoneName: 'longOffset', hour: '2-digit' };
  const hour = Number(new Intl.DateTimeFormat('en', hourOptions).format(now));
  const timeParts = new Intl.DateTimeFormat('en-US', offsetOptions).formatToParts(now);
  const offset = timeParts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
  return {
    date: new Intl.DateTimeFormat('en-US', dateOptions).format(now),
    time: new Intl.DateTimeFormat('en-US', timeOptions).format(now),
    time24: new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now),
    hour, offset,
    period: hour >= 6 && hour < 18 ? '☀️ Daytime' : '🌙 Nighttime',
    zone
  };
}

function getClock(flag, name, zone){
  try{
    const data = getTimeData(zone);
    return `${flag} *${name}*\n🕒 ${data.time}\n📅 ${data.date}\n🌐 ${data.offset}`;
  }catch{ return `${flag} *${name}*\n❌ Time unavailable`; }
}

module.exports = {
  name: "time",
  react: "🕒",
  alias: ["clock", "worldtime", "timezone", "worldclock"],
  category: "tools",
  execute: async (sock, m, args) => {
    const jid = m.key.remoteJid;
    const input = args.join(" ").trim() || (m.message?.extendedTextMessage?.text || "").replace(/^\.(time|clock|worldtime|timezone|worldclock)\s*/i, "").trim();
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    try{
      await sock.sendMessage(jid, { react: { text: "🕒", key: m.key } });

      // WORLD CLOCK
      if(['world', 'worldclock', 'all'].includes(input.toLowerCase())){
        let output = `╭━━━━━━━━━━━━━━━━━━╮\n      🌍 *XPRO WORLD CLOCK*\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;
        for(const [flag, name, zone] of clocks){
          output += getClock(flag, name, zone) + '\n\n';
        }
        output += `━━━━━━━━━━━━━━━━━━\n> 🌐 Powered by *XPRO TECH*`;
        return await reply(output.trim());
      }

      // FORMAT OPTIONS
      const formatMatch = input.match(/^(?:format|12h|24h)\s+(.+)$/i);
      if(formatMatch){
        const zone = resolveZone(formatMatch[1]);
        if(!zone) return await reply(`❌ Invalid timezone: *${formatMatch[1]}*`);
        const now = new Date();
        const time12 = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
        const time24 = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now);
        return await reply(`🕒 *XPRO CLOCK FORMAT*\n\n🌍 Timezone: ${zone}\n🕰️ 12-hour: ${time12}\n🕰️ 24-hour: ${time24}\n\n> Powered by XPRO TECH`);
      }

      // COMPARE TWO TIMEZONES
      const compareMatch = input.match(/^(?:compare)\s+(.+?)\s+(?:vs|and|to)\s+(.+)$/i);
      if(compareMatch){
        const zone1 = resolveZone(compareMatch[1]);
        const zone2 = resolveZone(compareMatch[2]);
        if(!zone1 || !zone2) return await reply(`❌ Invalid timezone.\n\nExample: .time compare Harare vs London`);
        const data1 = getTimeData(zone1);
        const data2 = getTimeData(zone2);
        return await reply(
          `╭━━━━━━━━━━━━━━━━━━╮\n   🌍 *TIME COMPARISON*\n╰━━━━━━━━━━━━━━━━━━╯\n\n` +
          `📍 *${zone1}*\n🕒 ${data1.time}\n📅 ${data1.date}\n🌐 ${data1.offset}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `📍 *${zone2}*\n🕒 ${data2.time}\n📅 ${data2.date}\n🌐 ${data2.offset}\n\n` +
          `> ✨ Powered by XPRO TECH`
        );
      }

      // NORMAL TIME LOOKUP
      const zone = resolveZone(input);
      if(!zone) return await reply(`❌ *TIMEZONE NOT FOUND*\n\nYou entered: *${input}*\n\nTry:\n• .time Harare\n• .time London\n• .time Asia/Tokyo\n• .time America/New_York\n• .time world`);

      const data = getTimeData(zone);
      const output = `╭━━━━━━━━━━━━━━━━━━╮\n      🕒 *XPRO WORLD TIME*\n╰━━━━━━━━━━━━━━━━━━╯\n\n🌍 *Timezone:* ${data.zone}\n\n🕰️ *Current Time*\n${data.time}\n\n⏱️ *24-Hour Format*\n${data.time24}\n\n📅 *Date*\n${data.date}\n\n🌐 *GMT Offset*\n${data.offset}\n\n${data.period}\n\n━━━━━━━━━━━━━━━━━━\n🌎 *WORLD TIME SERVICE*\n> ✨ Powered by *XPRO TECH*\n> 🤖 XPRO-MD\n\n${WATERMARK}`;
      return await reply(output.trim());

    }catch(e){
      console.error('[XPRO TIME ERROR]', e);
      return await reply(`❌ *TIME SERVICE ERROR*\n\nUnable to retrieve the requested time.\nPlease try again.\n\n> XPRO TECH`);
    }
  }
};
