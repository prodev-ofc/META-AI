const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

function isValidUrl(s){ try{ new URL(s); return true }catch{ return false } }

async function getQuotedOrOwnImageUrl(sock, message){
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if(quoted?.imageMessage){
    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
    const chunks=[]; for await(const c of stream) chunks.push(c);
    return await uploadImage(Buffer.concat(chunks));
  }
  if(message.message?.imageMessage){
    const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
    const chunks=[]; for await(const c of stream) chunks.push(c);
    return await uploadImage(Buffer.concat(chunks));
  }
  return null
}

module.exports={
  name:'removebg',
  react:"✂️",
  alias:['rmbg','nobg','bgremove'],
  category:'tools',
  desc:'Remove background from image',
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    let imageUrl=null

    try{
      if(args.length>0){
        const url=args.join(' ').trim()
        if(!isValidUrl(url)) return sock.sendMessage(jid,{text:`❌ Invalid URL\n\nUsage: .removebg <url>\n\n${WATERMARK}`},{quoted:m})
        imageUrl=url
      } else {
        imageUrl = await getQuotedOrOwnImageUrl(sock,m)
        if(!imageUrl){
          return sock.sendMessage(jid,{text:`📸 *Remove BG*\n\nUsage:\n• .removebg <image_url>\n• Reply to image with .removebg\n• Send image with caption .removebg\n\nEx: .removebg https://example.com/img.jpg\n\n${WATERMARK}`},{quoted:m})
        }
      }

      await sock.sendMessage(jid,{react:{text:"✂️",key:m.key}})

      const apiUrl = `https://api.siputzx.my.id/api/iloveimg/removebg?image=${encodeURIComponent(imageUrl)}`
      const res = await axios.get(apiUrl,{
        responseType:'arraybuffer',
        timeout:30000,
        headers:{'User-Agent':'Mozilla/5.0'}
      })

      if(res.status===200 && res.data){
        await sock.sendMessage(jid,{
          image: res.data,
          caption:`✨ *Background removed!*\n\n${WATERMARK}`
        },{quoted:m})
        await sock.sendMessage(jid,{react:{text:"✅",key:m.key}})
      }else throw new Error('Failed to process')

    }catch(e){
      console.log('[removebg] error:', e.message)
      let msg='❌ Failed to remove background.'
      if(e.response?.status===429) msg='⏰ Rate limit, try later.'
      if(e.response?.status===400) msg='❌ Invalid image URL/format.'
      if(e.code==='ECONNABORTED') msg='⏰ Timeout, try again.'
      await sock.sendMessage(jid,{text:`${msg}\n\n${WATERMARK}`},{quoted:m})
    }
  }
}
