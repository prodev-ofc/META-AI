const fs=require('fs'),path=require('path')
const commands=new Map()
function loadCommands(){
  const dir=path.join(__dirname,'meta')
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
  commands.clear()
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js'))
  console.log(`\n📂 [commands.js] Scanning ${files.length} files in ./meta/`)
  for(let file of files){
    try{
      delete require.cache[require.resolve(path.join(dir,file))]
      const cmd=require(path.join(dir,file))
      if(cmd.name){
        commands.set(cmd.name,cmd)
        console.log(`✅ Loaded .${cmd.name}`)
        if(cmd.alias) for(let a of cmd.alias) commands.set(a,cmd)
      }
    }catch(e){ console.log(`❌ ${file}: ${e.message}`) }
  }
  const unique=[...new Set([...commands.keys()])].length
  console.log(`📦 Total unique: ${unique} (${commands.size} with aliases)\n`)
}
function getCommands(){return commands}
module.exports={loadCommands,getCommands}
