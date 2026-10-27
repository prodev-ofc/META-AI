const fs = require('fs')
const path = require('path')

function loadCommands(){
  const commands = new Map()
  const dir = path.join(__dirname,'commands')
  if(!fs.existsSync(dir)) return commands
  
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.js'))
  for(const file of files){
    try{
      delete require.cache[require.resolve(path.join(dir,file))]
      const cmd = require(path.join(dir,file))
      if(!cmd.name) continue
      commands.set(cmd.name.toLowerCase(), cmd)
      if(cmd.alias){
        for(const a of cmd.alias) commands.set(a.toLowerCase(), cmd)
      }
      console.log(`✅ Loaded command: ${cmd.name} (${file})`)
    }catch(e){
      console.log(`❌ Failed ${file}:`, e.message)
    }
  }
  return commands
}

module.exports = { loadCommands }
