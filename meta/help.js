const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

module.exports={
  name:"help",
  alias:["commands"],
  category:"general",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const text=`╭─⟨ *META AI* ⟩─\n│ Owner: 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄\n│ Prefix: [ . ]...\n│ Mode: Public\n╰─────────────\n\nSelect a category below 👇`

    // NEW WhatsApp Interactive Message - this is what shows buttons now
    const msg = generateWAMessageFromContent(jid, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: "✨ META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄" }),
            header: proto.Message.InteractiveMessage.Header.create({
              title: "📂 SELECT CATEGORY",
              subtitle: "",
              hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💻 Dev Info", id: ".owner" }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", id: ".channel" }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💬 Support", id: ".support" }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📋 All Commands", id: ".allcommands" }) },
              ],
            })
          })
        }
      }
    }, { quoted: m });

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  }
}
