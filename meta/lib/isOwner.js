function isOwnerCheck(m, sock){
  try{
    if(m.key?.fromMe) return true;
    const botId = sock.user?.id || "";
    const sender = m.key?.participant || m.key?.remoteJid || "";
    if(botId && sender && botId.includes(sender.split('@')[0])) return true;
    // Add your owner numbers here if needed:
    // if(sender.includes("2637")) return true;
    return true; // For now allow all for testing - change to false to lock
  }catch{ return true; }
}
module.exports = { isOwnerCheck };
