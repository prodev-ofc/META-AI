// meta/cancel.js - cancels scheduled .leave
const activeLeaves = require('./leaveStore');

module.exports = {
    name: 'cancel',
    alias: ['stop', 'cancelleave'],
    desc: 'Cancel scheduled leave',
    category: 'meta',
    async execute(sock, msg, args, context = {}) {
        const from = context.from || msg?.key?.remoteJid;
        if (!from) return;
        const existing = activeLeaves.get(from);
        if (!existing) {
            return await sock.sendMessage(from, { text: '❌ No scheduled leave in this group.' }, { quoted: msg });
        }
        clearTimeout(existing.timeout);
        clearInterval(existing.interval);
        activeLeaves.delete(from);
        return await sock.sendMessage(from, { text: '✅ Scheduled leave cancelled. I am staying 👑' }, { quoted: msg });
    }
};
