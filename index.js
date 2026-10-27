const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const P = require('pino');
const fs = require('fs');
const { loadCommands, getCommands } = require('./commands');

const PORT = 8080;
const BOT_NAME = "META-AI";
const OWNER = "prodev zw";
const WATERMARK = "> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝖊𝐯 𝖔𝖋𝖋𝖎𝖈𝖎𝖆𝖑𝐬_";

if (!fs.existsSync('./session')) fs.mkdirSync('./session',{recursive:true});
if (!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
if (!fs.existsSync('./data/chatbot.json')) fs.writeFileSync('./data/chatbot.json','{}');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

let sock, isConnected=false;
loadCommands();

app.get('/', (req,res)=>{
  const cmds = [...new Set([...getCommands().keys()])].map(c=>`.${c}`).join(', ');
  res.send(`<body style="background:#111;color:#fff;text-align:center;font-family:sans-serif;padding:20px"><h2>🤖 ${BOT_NAME}</h2><p>By ${OWNER}</p><div style="background:#222;padding:20px;border-radius:12px;max-width:400px;margin:auto"><div style="padding:10px;border-radius:8px;background:${isConnected?'#0a3d1f':'#3d0a0a'}">${isConnected?'✅ CONNECTED':'❌ NOT CONNECTED'}</div><p style="font-size:11px">${cmds}</p><form method="POST" action="/pair"><input name="number" placeholder="2637xxxxxxx" style="width:90%;padding:12px;border-radius:8px;border:none"><br><br><button style="width:90%;padding:12px;background:#25D366;border:none;border-radius:8px;font-weight:bold">GET PAIR CODE</button></form></div></body>`);
});

app.post('/pair', async (req,res)=>{
  let num = req.body.number.replace(/[^0-9]/g,'');
  try{ let code = await sock.requestPairingCode(num); console.log(`CODE: ${code}`);}catch(e){console.log(e.toString());}
  res.redirect('/');
});

async function startBot(){
  const {state, saveCreds} = await useMultiFileAuthState('./session');
  const {version} = await fetchLatestBaileysVersion();
  console.log(`\n🚀 ${BOT_NAME} starting...`);
  sock = makeWASocket({version, logger:P({level:'silent'}), auth:{creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys,P({level:'silent'}))}, browser:Browsers.ubuntu('Chrome'), markOnlineOnConnect:true});
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', u=>{
    if(u.connection==='open'){ isConnected=true; console.log(`✅ ${BOT_NAME} CONNECTED`); }
    if(u.connection==='close'){ isConnected=false; setTimeout(startBot,3000); }
  });

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m=messages[0]; 
    if(!m.message) return;
    const t = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
    if(!t) return;
    
    const jid = m.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const pushName = m.pushName || "User";
    console.log(`\n[${new Date().toLocaleTimeString()}] [${isGroup?'GROUP':'PVT'}] ${pushName}: ${t.substring(0,80)}`);

    const commands = getCommands();

    for (let [name, cmd] of commands) {
      if (cmd.handleChatbot) {
        try {
          let handled = await cmd.handleChatbot(sock, m, m);
          if (handled) return;
        } catch(e){}
      }
    }

    if(!t.startsWith('.')) return;
    const args=t.slice(1).trim().split(/ +/); 
    const name=args.shift().toLowerCase();
    if(!name || !commands.has(name)) return;

    console.log(`⚡ Executing .${name}`);
    try{ await commands.get(name).execute(sock,m,args,{BOT_NAME,OWNER,WATERMARK,commands}); }catch(e){ console.log(`❌ Error .${name}:`, e.message); }
  });
}

app.listen(PORT,'0.0.0.0',()=>{ console.log(`Dashboard: http://localhost:${PORT}`); startBot(); });

// Debounced watcher
let reloadTimeout;
fs.watch('./meta', (event, filename)=>{
  if(filename && filename.endsWith('.js')){
    clearTimeout(reloadTimeout);
    reloadTimeout=setTimeout(()=>{
      console.log(`\n🔄 Detected ${filename}, reloading...`);
      loadCommands();
    },500);
  }
});
