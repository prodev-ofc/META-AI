const fs = require('fs');
const path = require('path');

function loadSessionFromEnv(){
  // If your pair panel gives you SESSION_ID env variable
  const sessionId = process.env.SESSION_ID || process.env.SESSION;
  if(!sessionId) return;
  
  try{
    // If session is base64
    const data = Buffer.from(sessionId, 'base64').toString();
    const dir = './auth_info_baileys';
    if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir, 'creds.json'), data);
    console.log('✅ Session loaded from ENV');
  }catch(e){
    console.log('Session load error', e.message);
  }
}

module.exports = { loadSessionFromEnv };
