module.exports={
  name:"owner", react:"👑", category:"info", alias:["dev","prodev","creator"], desc:"Show bot owner",
  execute: async (sock,m,args)=>{
    const ownerNumbers=["263788279395","263783546271"]
    const ownerName="𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖"
    
    await sock.sendMessage(m.key.remoteJid,{react:{text:"👑",key:m.key}})

    const vcard1=`BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:${ownerName};
TEL;type=CELL;type=VOICE;waid=${ownerNumbers[0]}:+${ownerNumbers[0]}
END:VCARD`

    const vcard2=`BEGIN:VCARD
VERSION:3.0
FN:${ownerName} 2
ORG:${ownerName};
TEL;type=CELL;type=VOICE;waid=${ownerNumbers[1]}:+${ownerNumbers[1]}
END:VCARD`

    await sock.sendMessage(m.key.remoteJid,{
      contacts:{
        displayName: ownerName,
        contacts:[{vcard:vcard1},{vcard:vcard2}]
      }
    },{quoted:m})
  }
}
