const axios = require('axios')

const PRIMARY_API = 'https://eliteprotech-apis.zone.id/ai/deepseekai'
const KNIGHT_API = 'https://knightbotapi.stream/api/ai/chat?apikey=knight'

const PROMPT = `
You are XPRO ZLI, an AI created by PRODEV ZW (PRODEV OFC) under XPRO-TECH.

Answer the user's question directly and helpfully.

For your answers:
- Give full explanations when needed.
- Include key points.
- Provide tutorials and step-by-step instructions when appropriate.
- Give practical examples.
- For coding, provide complete usable code and explain it.
- Make answers clear, organized and informative.
- Never reply with just an acknowledgment.
- If asked who you are, explain that you are XPRO ZLI, created by PRODEV ZW under XPRO-TECH.

Finish your answers with:

_XPRO ZLI | XPRO-TECH | Created by PRODEV ZW_
`

const getAnswer = data => {
    if (typeof data === 'string') {
        try {
            return getAnswer(JSON.parse(data))
        } catch {
            return data.trim()
        }
    }

    return (
        data?.response ||
        data?.answer ||
        data?.result ||
        data?.reply ||
        data?.text ||
        data?.output ||
        data?.data?.response ||
        data?.data?.answer ||
        data?.data?.result ||
        data?.data?.text ||
        data?.choices?.[0]?.message?.content ||
        ''
    )
}

const ask = async (url, params) => {
    const { data } = await axios.get(url, {
        params,
        timeout: 90000
    })

    const answer = getAnswer(data)

    if (!answer || data?.success === false) {
        throw new Error('No AI response')
    }

    return String(answer).trim()
}

module.exports = {
    name: 'ai',
    react: '🤖',
    alias: ['zli', 'xprozli', 'deepseek', 'gpt'],
    category: 'ai',

    async execute(sock, m, args) {
        const question = args.join(' ').trim()
        const quoted = m.quoted?.text || m.quoted?.caption || ''

        const text = question
            ? quoted
                ? `${question}\n\nMessage:\n${quoted}`
                : question
            : quoted

        if (!text) {
            return m.reply('Ask XPRO ZLI a question or reply to a message with .ai')
        }

        const prompt = `${PROMPT}\n\nQUESTION:\n${text}`

        await sock.sendMessage(m.key.remoteJid, {
            react: { text: '🤔', key: m.key }
        })

        await sock.sendMessage(m.key.remoteJid, {
            text: '🤖 *XPRO ZLI is thinking...*'
        }, { quoted: m })

        try {
            let answer

            try {
                answer = await ask(PRIMARY_API, { text: prompt })
            } catch {
                answer = await ask(KNIGHT_API, { q: prompt })
            }

            await sock.sendMessage(m.key.remoteJid, {
                text: answer
            }, { quoted: m })

            await sock.sendMessage(m.key.remoteJid, {
                react: { text: '💚', key: m.key }
            })

        } catch {
            await sock.sendMessage(m.key.remoteJid, {
                text: '❌ XPRO ZLI is temporarily unavailable. Please try again.'
            }, { quoted: m })

            await sock.sendMessage(m.key.remoteJid, {
                react: { text: '❌', key: m.key }
            })
        }
    }
}
