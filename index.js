const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const { loadCommands } = require('./commands')

function getRealSender(m){
  // Baileys v7+ LID fix
  // priority: senderPn > participantPn > remoteJidAlt > participantAlt > remoteJid > participant
  return m.key.senderPn || m.key.participantPn || m.key.remoteJidAlt || m.key.participantAlt || m.key.participant || m.key.remoteJid || ""
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
    logger: pino({level:'silent'}),
    browser: ["Ubuntu","Chrome","110.0.5585.95"],
    syncFullHistory: false,
    markOnlineOnConnect: true
  })
  sock.ev.on('creds.update', saveCreds)
  
  let commands = loadCommands()

  sock.ev.on('connection.update', async ({connection, lastDisconnect})=>{
    if(connection==='open'){
      console.log("✅ META AI CONNECTED")
      commands = loadCommands()
    }
    if(connection==='close'){
      const code = lastDisconnect?.error?.output?.statusCode
      if(code !== DisconnectReason.loggedOut) setTimeout(()=>start(),3000)
    }
  })

  sock.ev.on('messages.upsert', async ({messages})=>{
    try{
      const m = messages[0]
      if(!m?.message) return
      const cfg = require('./config')
      const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ""
      if(!body.startsWith(cfg.prefix)) return

      const args = body.slice(cfg.prefix.length).trim().split(/ +/)
      const cmdName = args.shift().toLowerCase()
      commands = loadCommands()
      const cmd = commands.get(cmdName)
      if(!cmd) return
      
      console.log(`Cmd: ${cmd.name} RealSender: ${getRealSender(m)} Remote: ${m.key.remoteJid}`)
      await cmd.execute(sock, m, args, commands)
    }catch(e){ console.log("Cmd error:", e.stack) }
  })
}
start()
