
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "pair",
  category: "owner",
  desc: "Generate REAL pairing code",
  owner: true,

  async execute(sock, m, args, { WATERMARK }) {
    // FIX: Join all args -> .pair 27 63 637 0246 => 27636370246
    let number = args.join('').replace(/[^0-9]/g, '');

    // If still no number and it's a reply in group, try to get real phone number (not LID)
    if (!number) {
      const ctx = m.message?.extendedTextMessage?.contextInfo;
      const participant = ctx?.participant || "";
      // LID ends with @lid or is >13 digits, ignore it
      if (participant && participant.endsWith('@s.whatsapp.net')) {
        number = participant.split('@')[0];
      }
      // If participant is LID (14+ digits or @lid), don't use it
      if (number.length > 13 || number.length < 10) number = "";
    }

    if (!number) {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❓", key: m.key } });
      return sock.sendMessage(m.key.remoteJid, {
        text: `*PAIR USAGE*\n\n.pair 2637xxxxxxx\n.pair 2763xxxxxxx\n\nNo space needed:\n.pair 27 63 637 0246 → works\n\n${WATERMARK}`
      }, { quoted: m });
    }

    // Validate
    if (number.length < 10 || number.length > 13) {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      return sock.sendMessage(m.key.remoteJid, {
        text: `❌ Invalid: ${number} (${number.length} digits)\nUse: 2637xxxxxxxx or 2763xxxxxxx\n${WATERMARK}`
      }, { quoted: m });
    }

    const id = `${number}_${Date.now().toString().slice(-4)}`;
    const dir = `./temp/pair/${id}`;
    fs.mkdirSync(dir, { recursive: true });

    await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } });

    const getCodeWithRetry = async (retries = 2) => {
      for (let i = 0; i < retries; i++) {
        try {
          const { state, saveCreds } = await useMultiFileAuthState(dir);
          const { version } = await fetchLatestBaileysVersion();
          const pairSock = makeWASocket({
            version,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })) },
            browser: Browsers.ubuntu("Desktop"),
            logger: P({ level: "silent" }),
            markOnlineOnConnect: false,
            syncFullHistory: false,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000
          });
          pairSock.ev.on('creds.update', saveCreds);
          await delay(4000);
          const rawCode = await pairSock.requestPairingCode(number);
          return { code: rawCode.match(/.{1,4}/g)?.join("-") || rawCode, sock: pairSock };
        } catch (e) {
          console.log(`Pair attempt ${i+1} failed: ${e.message}`);
          if (e.message.includes("Connection Closed") && i < retries - 1) {
            await delay(3000);
            continue;
          }
          throw e;
        }
      }
    };

    try {
      const { code, sock: pairSock } = await getCodeWithRetry(3);
      console.log(`[PAIR] ${number} => ${code}`);

      // EASY COPY - code alone
      await sock.sendMessage(m.key.remoteJid, { text: `${code}` }, { quoted: m });
      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

      pairSock.ev.on('connection.update', async (u) => {
        if (u.connection === 'open') {
          await delay(4000);
          const credsPath = path.join(dir, 'creds.json');
          if (fs.existsSync(credsPath)) {
            const b64 = Buffer.from(fs.readFileSync(credsPath)).toString('base64');
            fs.writeFileSync(path.join(dir, 'SESSION_ID.txt'), b64);
            await sock.sendMessage(m.key.remoteJid, { react: { text: "🎉", key: m.key } });
          }
        }
      });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, {
        text: `❌ ${e.message}\n\nFix:\n1. Number has <4 devices?\n2. WhatsApp updated?\n3. Wait 60 sec retry\n\n${WATERMARK}`
      }, { quoted: m });
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    }
  }
};
