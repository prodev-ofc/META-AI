const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');
const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
      resolve((stdout || '').toString());
    });
  });
}

async function hasGitRepo() {
  const gitDir = path.join(process.cwd(), '.git');
  if (!fs.existsSync(gitDir)) return false;
  try { await run('git --version'); return true; } catch { return false; }
}

async function updateViaGit() {
  const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
  await run('git fetch --all --prune');
  const newRev = (await run('git rev-parse origin/main')).trim();
  const alreadyUpToDate = oldRev === newRev;
  await run(`git reset --hard ${newRev}`);
  await run('git clean -fd');
  return { oldRev, newRev, alreadyUpToDate };
}

function downloadFile(url, dest, visited = new Set()) {
  return new Promise((resolve, reject) => {
    if (visited.has(url) || visited.size > 5) return reject(new Error('Too many redirects'));
    visited.add(url);
    const client = url.startsWith('https://') ? require('https') : require('http');
    const req = client.get(url, { headers: { 'User-Agent': 'META-AI-Updater/1.0' } }, res => {
      if ([301,302,303,307,308].includes(res.statusCode)) {
        const nextUrl = new URL(res.headers.location, url).toString();
        res.resume();
        return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', err => { fs.unlink(dest, () => reject(err)); });
    });
    req.on('error', err => { fs.unlink(dest, () => reject(err)); });
  });
}

async function extractZip(zipPath, outDir) {
  if (process.platform === 'win32') {
    await run(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g,'/')}' -Force"`);
    return;
  }
  try { await run('command -v unzip'); await run(`unzip -o '${zipPath}' -d '${outDir}'`); return; } catch {}
  try { await run('command -v 7z'); await run(`7z x -y '${zipPath}' -o'${outDir}'`); return; } catch {}
  try { await run('busybox unzip -h'); await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`); return; } catch {}
  throw new Error("No unzip tool found");
}

function copyRecursive(src, dest, ignore = [], outList = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (ignore.includes(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) copyRecursive(s, d, ignore, outList);
    else { fs.copyFileSync(s, d); outList.push(entry); }
  }
}

async function updateViaZip(zipOverride) {
  const zipUrl = (zipOverride || settings.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
  if (!zipUrl) throw new Error('No ZIP URL set in settings.updateZipUrl');
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const zipPath = path.join(tmpDir, 'update.zip');
  await downloadFile(zipUrl, zipPath);
  const extractTo = path.join(tmpDir, 'update_extract');
  if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
  await extractZip(zipPath, extractTo);
  const [root] = fs.readdirSync(extractTo).map(n => path.join(extractTo, n));
  const srcRoot = fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;
  const ignore = ['node_modules','.git','session','tmp','temp','data','baileys_store.json'];
  const copied = [];
  let preservedOwner=null, preservedBotOwner=null;
  try{ const cur=require('../settings'); preservedOwner=cur.ownerNumber; preservedBotOwner=cur.botOwner; }catch{}
  copyRecursive(srcRoot, process.cwd(), ignore, copied);
  if (preservedOwner) {
    try{
      const p=path.join(process.cwd(),'settings.js');
      let t=fs.readFileSync(p,'utf8');
      t=t.replace(/ownerNumber:\s*'[^']*'/, `ownerNumber: '${preservedOwner}'`);
      if(preservedBotOwner) t=t.replace(/botOwner:\s*'[^']*'/, `botOwner: '${preservedBotOwner}'`);
      fs.writeFileSync(p,t);
    }catch{}
  }
  try{ fs.rmSync(extractTo,{recursive:true,force:true}); }catch{}
  try{ fs.rmSync(zipPath,{force:true}); }catch{}
  return { copiedFiles: copied };
}

async function restartProcess(sock, chatId, m){
  try{ await sock.sendMessage(chatId,{text:`✅ Update complete! Restarting…\n\n${WATERMARK}`},{quoted:m}) }catch{}
  try{ await run('pm2 restart all'); return; }catch{}
  setTimeout(()=>process.exit(0),500)
}

module.exports={
  name:"update",
  react:"🔄",
  alias:["upgrade","pull"],
  category:"owner",
  desc:"Update bot from git/zip",
  execute: async (sock,m,args)=>{
    const chatId=m.key.remoteJid
    const senderId=m.key.participant || m.key.remoteJid
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!m.key.fromMe && !isOwner) {
      return sock.sendMessage(chatId, { text: 'Only bot owner or sudo can use .update' }, { quoted: m });
    }

    const zipOverride=args[0]

    try{
      await sock.sendMessage(chatId, { text: '🔄 Updating the bot, please wait…', react:{text:"🔄",key:m.key} }, { quoted: m });

      if (await hasGitRepo()) {
        const { oldRev, newRev, alreadyUpToDate } = await updateViaGit();
        const summary = alreadyUpToDate ? `✅ Already up to date: ${newRev}` : `✅ Updated ${oldRev.slice(0,7)} → ${newRev.slice(0,7)}`;
        console.log('[update]', summary);
        await run('npm install --no-audit --no-fund');
        await sock.sendMessage(chatId, { text: `${summary}\n\n${WATERMARK}` }, { quoted: m });
      } else {
        await updateViaZip(zipOverride);
        await sock.sendMessage(chatId, { text: `✅ Update done via ZIP.\n\n${WATERMARK}` }, { quoted: m });
      }

      await restartProcess(sock, chatId, m);

    }catch(e){
      console.error('[update] failed:', e)
      await sock.sendMessage(chatId, { text: `❌ Update failed:\n${e.message}\n\n${WATERMARK}` }, { quoted: m });
    }
  }
}
