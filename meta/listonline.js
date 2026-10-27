module.exports = {
  name: "listonline",
  alias: ["online", "active", "tagonline", "onlinelist"],
  category: "group",
  desc: "Tag only truly online members",
  react: "👀",
  async execute(sock, m, args, extra) {
    const BOT_NAME = extra?.BOT_NAME || "META-AI";
    const WATERMARK = extra?.WATERMARK || "> ✨️Meta AI by prodev officials";

    if (!m.key.remoteJid.endsWith('@g.us')) {
      return await sock.sendMessage(m.key.remoteJid, { text: "❌ Group only" }, { quoted: m });
    }

    try { await sock.sendMessage(m.key.remoteJid, { react: { text: "👀", key: m.key } }); } catch {}

    const sent = await sock.sendMessage(m.key.remoteJid, { 
      text: `╭─◊ *CHECKING ONLINE* ◊─╮\n│ 🔍 Scanning...\n│ ⏳ 8 sec wait\n╰───────────────` 
    }, { quoted: m });

    try {
      const groupMeta = await sock.groupMetadata(m.key.remoteJid);
      const participants = groupMeta.participants.map(p => p.id);
      const onlineMap = {};

      const handler = (update) => {
        try {
          const presences = update.presences || update;
          if (update.presences) {
            for (let jid in update.presences) {
              const data = update.presences[jid];
              const presence = data?.lastKnownPresence || data?.presence;
              if (['available', 'composing', 'recording'].includes(presence)) {
                onlineMap[jid] = true;
              }
            }
          } else {
            for (let jid in update) {
              if (jid.endsWith('@s.whatsapp.net')) {
                const p = update[jid]?.lastKnownPresence;
                if (['available', 'composing', 'recording'].includes(p)) onlineMap[jid] = true;
              }
            }
          }
        } catch {}
      };

      sock.ev.on('presence.update', handler);

      // Subscribe
      for (let jid of participants) {
        try { await sock.presenceSubscribe(jid); } catch {}
        await new Promise(r => setTimeout(r, 40));
      }

      try { await sock.sendPresenceUpdate('composing', m.key.remoteJid); } catch {}
      await new Promise(r => setTimeout(r, 1000));

      for (let jid of participants) {
        try { await sock.presenceSubscribe(jid); } catch {}
      }

      await new Promise(r => setTimeout(r, 7000));

      sock.ev.off('presence.update', handler);
      try { await sock.sendPresenceUpdate('paused', m.key.remoteJid); } catch {}

      let onlineMembers = Object.keys(onlineMap).filter(j => participants.includes(j));

      if (onlineMembers.length === 0) {
        await sock.sendMessage(m.key.remoteJid, {
          text: `╭─❏ *ONLINE CHECK* ❏\n│ 😴 No online detected\n│ 👥 Total: ${participants.length}\n│\n│ ℹ️ Privacy hides some online\n╰──────────────\n${WATERMARK}`,
          edit: sent.key
        });
        return;
      }

      // Build tag message
      let txt = `╭─── ${BOT_NAME} ───\n`;
      txt += `│ 🟢 Online: ${onlineMembers.length}/${participants.length}\n`;
      txt += `├──────────────\n`;
      for (let j of onlineMembers) {
        const name = j.split('@')[0];
        txt += `│ @${name}\n`;
      }
      txt += `╰──────────────\n${WATERMARK}`;

      // Edit the scanning message to success
      await sock.sendMessage(m.key.remoteJid, {
        text: `╭─❏ *ONLINE FOUND* ❏\n│ ✅ ${onlineMembers.length} online tagged\n╰──────────────\n${WATERMARK}`,
        edit: sent.key
      });

      await sock.sendMessage(m.key.remoteJid, { text: txt, mentions: onlineMembers }, { quoted: m });

      try { await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } }); } catch {}

    } catch (e) {
      console.log("listonline error", e);
      await sock.sendMessage(m.key.remoteJid, { text: `❌ ${e.message}\n${WATERMARK}`, edit: sent.key });
    }
  }
};
