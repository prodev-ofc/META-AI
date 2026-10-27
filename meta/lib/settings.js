const fs = require('fs');
const path = require('path');
const SETTINGS_PATH = path.join(__dirname, '../../database/settings.json');
const DEFAULTS = {
  botName: "META-AI",
  botImage: "./media/menu.jpg",
  ownerName: "prodev zw",
  prefix: ".",
  autoReact: false,
  autoReply: false,
  autoReplyText: "Hello! I'm META-AI bot 🤖",
  alwaysOnline: true,
  alwaysOffline: false,
  replyMessage: "Hello! 👋 How can I help?",
  autoStatusReact: false,
  autoViewStatus: false,
  autoStatusReply: false,
  statusReplyText: "❤️ Nice status!",
  watermark: "> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_"
};
function ensureFile(){
  const dir = path.dirname(SETTINGS_PATH);
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  if(!fs.existsSync(SETTINGS_PATH)) fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULTS,null,2));
}
function getSettings(){
  ensureFile();
  try{ return {...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH,'utf8'))}; }catch{ return {...DEFAULTS}; }
}
function updateSettings(updates){
  ensureFile();
  const newData = {...getSettings(), ...updates};
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(newData,null,2));
  return newData;
}
module.exports = { getSettings, updateSettings, DEFAULTS };
