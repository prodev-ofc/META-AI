
// meta/leave.js - DELETE LAST COUNTDOWN + SEND NEW ONE
const activeLeaves = require('./leaveStore');

function parseDuration(input) {
    if (!input) return null;
    const match = String(input).toLowerCase().trim().match(/^(\d+(?:\.\d+)?)(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)?$/);
    if (!match) return null;
    const value = parseFloat(match[1]);
    const unit = match[2] || 'm';
    if (unit.startsWith('s')) return value * 1000;
    if (unit.startsWith('m')) return value * 60 * 1000;
    if (unit.startsWith('h')) return value * 60 * 60 * 1000;
    if (unit.startsWith('d')) return value * 24 * 60 * 60 * 1000;
    return null;
}

function formatRemaining(ms) {
    if (ms <= 0) return '0s';
    const totalSec = Math.ceil(ms / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getCountdownInterval(totalMs) {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_MIN = 60 * 1000;
    if (totalMs >= ONE_DAY) return 2 * 60 * 60 * 1000;
    if (totalMs >= ONE_HOUR) return 40 * 60 * 1000;
    if (totalMs > ONE_MIN) return 5 * 1000;
    return 1 * 1000;
}

async function safeReact(sock, msg, emoji) {
    try {
        if (!sock || !msg || !msg.key) return;
        await sock.sendMessage(msg.key.remoteJid || msg.key.participant, {
            react: { text: emoji, key: msg.key }
        });
    } catch (e) {}
}

// Delete a message by its key
async function deleteMessage(sock, from, key) {
    try {
        if (!key) return;
        await sock.sendMessage(from, { delete: key });
    } catch (e) {
        // ignore - maybe already deleted or no admin rights
    }
}

module.exports = {
    name: 'leave',
    alias: ['leavegroup', 'exit'],
    desc: 'Schedule bot to leave group after time',
    category: 'meta',
    async execute(sock, msg, args, context = {}) {
        try {
            const from = context.from || msg?.key?.remoteJid;
            const isGroup = context.isGroup ?? (from ? from.endsWith('@g.us') : false);
            if (!from) return;
            if (!isGroup) {
                return await sock.sendMessage(from, { text: '❌ This command works only in a group.' }, { quoted: msg });
            }

            const sub = (args[0] || '').toLowerCase();

            if (sub === 'cancel' || sub === 'stop') {
                const existing = activeLeaves.get(from);
                if (!existing) return await sock.sendMessage(from, { text: '❌ No scheduled leave in this group.' }, { quoted: msg });
                clearTimeout(existing.timeout);
                clearInterval(existing.interval);
                // delete last countdown too when cancelling
                await deleteMessage(sock, from, existing.lastCountdownKey);
                activeLeaves.delete(from);
                return await sock.sendMessage(from, { text: '✅ Scheduled leave cancelled. I am staying 👑' }, { quoted: msg });
            }

            if (sub === 'status' || sub === 'time') {
                const existing = activeLeaves.get(from);
                if (!existing) return await sock.sendMessage(from, { text: 'ℹ️ No scheduled leave here.' }, { quoted: msg });
                const left = existing.endTime - Date.now();
                return await sock.sendMessage(from, { text: `⏳ I will leave in *${formatRemaining(left)}*\nReason: ${existing.reason || 'No reason'}` }, { quoted: msg });
            }

            if (!args[0]) {
                return await sock.sendMessage(from, {
                    text: `👋 *LEAVE COMMAND*\n\n• .leave 20 = 20 minutes\n• .leave 30s = 30 seconds\n• .leave 1h = 1 hour\n• .leave 2d = 2 days\n• .leave cancel / .cancel = cancel\n• .leave status = check time`
                }, { quoted: msg });
            }

            if (activeLeaves.has(from)) {
                const old = activeLeaves.get(from);
                clearTimeout(old.timeout);
                clearInterval(old.interval);
                await deleteMessage(sock, from, old.lastCountdownKey);
                activeLeaves.delete(from);
            }

            const totalMs = parseDuration(args[0]);
            if (!totalMs || totalMs < 1000) {
                return await sock.sendMessage(from, { text: '❌ Invalid time. Example: .leave 20 | .leave 30s | .leave 1h | .leave 2d' }, { quoted: msg });
            }

            const reason = args.slice(1).join(' ') || 'No reason given';
            const endTime = Date.now() + totalMs;
            const countdownInterval = getCountdownInterval(totalMs);

            await safeReact(sock, msg, '👋');

            await sock.sendMessage(from, {
                text: `👋 *LEAVE SCHEDULED*\n\n⏰ I will leave in *${formatRemaining(totalMs)}*\n📝 Reason: ${reason}\n\nType *.leave cancel* or *.cancel* to stop me.`
            }, { quoted: msg });

            // Track last countdown message to delete it next time
            let lastCountdownKey = null;
            const entry = { timeout: null, interval: null, endTime, totalMs, reason, lastCountdownKey: null };
            activeLeaves.set(from, entry);

            const interval = setInterval(async () => {
                const left = endTime - Date.now();
                if (left <= 0) return;

                try {
                    // 1. DELETE LAST COUNTDOWN
                    if (lastCountdownKey) {
                        await deleteMessage(sock, from, lastCountdownKey);
                    }

                    // 2. SEND NEW COUNTDOWN
                    const sent = await sock.sendMessage(from, {
                        text: `⏳ *Countdown:* I will leave in *${formatRemaining(left)}* 👋\nReason: ${reason}`
                    });

                    // 3. SAVE ITS KEY FOR NEXT DELETE
                    if (sent?.key) {
                        lastCountdownKey = sent.key;
                        entry.lastCountdownKey = sent.key;
                    }
                } catch (e) {}
            }, countdownInterval);

            const timeout = setTimeout(async () => {
                clearInterval(interval);
                activeLeaves.delete(from);
                try {
                    // Delete last countdown before leaving message
                    await deleteMessage(sock, from, lastCountdownKey);

                    await sock.sendMessage(from, { text: `👋 *Time up!* Leaving now...\n\nThanks for having me ❤️\nReason: ${reason}\n\n- @skyboy101 | THE LONER KING 👑` });
                    await safeReact(sock, msg, '👋');
                    await new Promise(r => setTimeout(r, 1500));
                    if (typeof sock.groupLeave === 'function') {
                        await sock.groupLeave(from);
                    }
                } catch (e) {
                    console.log('Leave error:', e.message);
                }
            }, totalMs);

            entry.timeout = timeout;
            entry.interval = interval;

        } catch (err) {
            console.log('Leave outer error:', err);
        }
    }
};
