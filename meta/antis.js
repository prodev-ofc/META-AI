const WATERMARK = "> _✨️Meta AI by 𝖕𝖗𝖔𝐝𝐞𝐯 𝖔𝖋𝖋𝖎𝐜𝐢𝐚𝐥𝐬_";

const MAX_WARNINGS = 3;
const WARNING_RESET = 24 * 60 * 60 * 1000;

const warnings = new Map();
const registeredSockets = new WeakSet();

function norm(jid = "") {
  return jid.split("@")[0].split(":")[0];
}

async function isAdmin(sock, jid, senderId) {
  try {
    const meta = await sock.groupMetadata(jid);

    return meta.participants.some(p =>
      (norm(p.id) === norm(senderId) || p.id === senderId) && p.admin
    );
  } catch {
    return false;
  }
}

function isSticker(m) {
  let msg = m.message;

  while (msg) {
    if (msg.stickerMessage) return true;

    msg =
      msg.ephemeralMessage?.message ||
      msg.viewOnceMessage?.message ||
      msg.viewOnceMessageV2?.message ||
      msg.documentWithCaptionMessage?.message;
  }

  return false;
}

async function detectSticker(sock, m) {
  const jid = m.key.remoteJid;

  if (!jid?.endsWith("@g.us")) return;
  if (m.key.fromMe || !global.antiSticker?.[jid]) return;
  if (!isSticker(m)) return;

  const sender = m.key.participant;
  if (!sender) return;

  try {
    // Ignore group admins
    if (await isAdmin(sock, jid, sender)) return;

    // Delete sticker
    await sock.sendMessage(jid, {
      delete: m.key
    });

    const key = `${jid}:${norm(sender)}`;
    const now = Date.now();

    let record = warnings.get(key) || {
      count: 0,
      time: now
    };

    if (now - record.time > WARNING_RESET) {
      record = { count: 0, time: now };
    }

    record.count++;
    warnings.set(key, record);

    if (record.count >= MAX_WARNINGS) {
      const botJid = sock.user?.id;

      if (!botJid || !(await isAdmin(sock, jid, botJid))) {
        return sock.sendMessage(jid, {
          text: `⚠️ @${norm(sender)} reached the warning limit, but I cannot kick them because I am not a group admin.\n\n${WATERMARK}`,
          mentions: [sender]
        });
      }

      await sock.groupParticipantsUpdate(jid, [sender], "remove");
      warnings.delete(key);

      return sock.sendMessage(jid, {
        text: `🥾 *ANTISTICKER KICK*\n\n👤 User: @${norm(sender)}\n⚠️ Warnings: ${MAX_WARNINGS}\n📌 Reason: Repeated sticker messages.\n\n${WATERMARK}`,
        mentions: [sender]
      });
    }

    await sock.sendMessage(jid, {
      text: `🚫 *STICKER NOT ALLOWED!*\n\n👤 User: @${norm(sender)}\n⚠️ Warning: ${record.count}/${MAX_WARNINGS}\n🗑️ Sticker deleted.\n\n${WATERMARK}`,
      mentions: [sender]
    });

  } catch (e) {
    console.log("ANTISTICKER ERROR:", e);
  }
}

function registerHandler(sock) {
  if (!sock || registeredSockets.has(sock)) return;

  registeredSockets.add(sock);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const m of messages || []) {
      await detectSticker(sock, m);
    }
  });
}

module.exports = {
  name: "antisticker",
  alias: ["asticker", "stickerblock"],
  category: "group",
  desc: "Automatically detect, delete, warn and kick sticker senders",

  execute: async (sock, m, args) => {
    // Register automatic detector
    registerHandler(sock);

    const jid = m.key.remoteJid;

    if (!jid.endsWith("@g.us")) {
      return sock.sendMessage(jid, {
        text: `❌ Group only\n\n${WATERMARK}`
      }, { quoted: m });
    }

    const sender = m.key.participant || jid;
    const owner = m.key.fromMe;
    const admin = await isAdmin(sock, jid, sender);

    if (!owner && !admin) {
      return sock.sendMessage(jid, {
        text: `❌ Only admins / owner can configure AntiSticker.\n\n${WATERMARK}`
      }, { quoted: m });
    }

    const action = (args[0] || "status").toLowerCase();

    global.antiSticker = global.antiSticker || {};

    if (action === "on") {
      global.antiSticker[jid] = true;

      return sock.sendMessage(jid, {
        text: `✅ *ANTISTICKER ENABLED*\n\n🗑️ Sticker deletion: ON\n⚠️ Warnings: ${MAX_WARNINGS}\n🥾 Kick after ${MAX_WARNINGS} warnings.\n\n${WATERMARK}`
      }, { quoted: m });
    }

    if (action === "off") {
      delete global.antiSticker[jid];

      return sock.sendMessage(jid, {
        text: `❌ *ANTISTICKER DISABLED*\n\n${WATERMARK}`
      }, { quoted: m });
    }

    if (action === "status") {
      return sock.sendMessage(jid, {
        text: `╭───❒ *ANTISTICKER* ❒───╮\n│\n│ 📌 Status: ${global.antiSticker[jid] ? "🟢 ON" : "🔴 OFF"}\n│ ⚠️ Warning limit: ${MAX_WARNINGS}\n│ 🗑️ Delete stickers: YES\n│ 🥾 Kick repeat offenders: YES\n│\n╰────────────────────╯\n\n${WATERMARK}`
      }, { quoted: m });
    }

    return sock.sendMessage(jid, {
      text: `❌ Invalid option.\n\n.antisticker on\n.antisticker off\n.antisticker status\n\n${WATERMARK}`
    }, { quoted: m });
  }
};
