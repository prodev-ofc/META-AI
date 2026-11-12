const WATERMARK="> _✨META AI by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐀𝐏𝐏𝐋𝐄𝐒𝐒𝐀𝐍𝐂𝐄_"

let games = {} // jid -> { board, turn, players: [p1, p2], status }

function renderBoard(board){
  // board = 9 array [' ','X','O']
  const c = (i) => board[i]===' ' ? `${i+1}️⃣` : (board[i]==='X' ? '❌' : '⭕')
  return `${c(0)} ${c(1)} ${c(2)}\n${c(3)} ${c(4)} ${c(5)}\n${c(6)} ${c(7)} ${c(8)}`
}

function checkWin(b){
  const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for(const [a,c,d] of wins){ if(b[a]!==' ' && b[a]===b[c] && b[a]===b[d]) return b[a] }
  if(!b.includes(' ')) return 'draw'
  return null
}

module.exports={
  name:"ttt",
  react:"🎮",
  alias:["tictactoe","tic"],
  category:"games",
  desc:"Tic Tac Toe game",
  execute: async (sock,m,args)=>{
    const jid=m.key.remoteJid
    const sender=m.key.participant || m.key.remoteJid
    const text = args.join(' ').toLowerCase().trim()

    if(!games[jid]) games[jid]={ board:Array(9).fill(' '), turn:'X', players:[], status:'waiting' }

    const game = games[jid]

    // commands: .ttt start, .ttt join, .ttt 1-9, .ttt stop
    if(text==='stop' || text==='end' || text==='reset'){
      delete games[jid]
      return sock.sendMessage(jid,{text:`🎮 Game reset!\nStart new with: .ttt start\n\n${WATERMARK}`},{quoted:m})
    }

    if(text==='start' || text==='' || text==='create'){
      games[jid]={ board:Array(9).fill(' '), turn:'X', players:[sender], status:'waiting' }
      return sock.sendMessage(jid,{
        text:`*🎮 TIC TAC TOE*\n\nPlayer X: @${sender.split('@')[0]}\nWaiting for Player O...\n\nSecond player type: .ttt join\n\nBoard:\n${renderBoard(games[jid].board)}\n\n${WATERMARK}`,
        mentions:[sender]
      },{quoted:m})
    }

    if(text==='join'){
      if(!game.players.length){
        return sock.sendMessage(jid,{text:`No game active. Start with .ttt start\n\n${WATERMARK}`},{quoted:m})
      }
      if(game.players.includes(sender)) return sock.sendMessage(jid,{text:`You already joined!\n\n${WATERMARK}`},{quoted:m})
      if(game.players.length>=2) return sock.sendMessage(jid,{text:`Game already full!\n\n${WATERMARK}`},{quoted:m})
      game.players.push(sender)
      game.status='playing'
      return sock.sendMessage(jid,{
        text:`*🎮 GAME STARTED*\n\nX: @${game.players[0].split('@')[0]}\nO: @${game.players[1].split('@')[0]}\n\nTurn: @${game.players[0].split('@')[0]} (❌)\nUse: .ttt 1-9\n\n${renderBoard(game.board)}\n\n${WATERMARK}`,
        mentions:game.players
      },{quoted:m})
    }

    // move 1-9
    const pos = parseInt(text) 
    if(isNaN(pos) || pos<1 || pos>9){
      return sock.sendMessage(jid,{text:`*🎮 TIC TAC TOE HELP*\n\n.ttt start - create game\n.ttt join - join as O\n.ttt 1-9 - make move\n.ttt stop - end game\n\nPositions:\n1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣\n\nCurrent Board:\n${renderBoard(game.board)}\n\n${WATERMARK}`},{quoted:m})
    }

    if(game.status!=='playing') return sock.sendMessage(jid,{text:`Game not started. Need 2 players.\n.ttt join\n\n${WATERMARK}`},{quoted:m})

    const idx = game.players.indexOf(sender)
    if(idx===-1) return sock.sendMessage(jid,{text:`You are not in this game! Spectating.\n\n${WATERMARK}`},{quoted:m})

    const expectedTurn = game.turn==='X' ? 0 : 1
    if(idx!==expectedTurn){
      return sock.sendMessage(jid,{text:`Not your turn! Turn: @${game.players[expectedTurn].split('@')[0]}\n\n${WATERMARK}`, mentions:[game.players[expectedTurn]]},{quoted:m})
    }

    if(game.board[pos-1]!==' ') return sock.sendMessage(jid,{text:`Position ${pos} already taken!\n\n${renderBoard(game.board)}\n\n${WATERMARK}`},{quoted:m})

    game.board[pos-1]=game.turn

    const win = checkWin(game.board)
    if(win){
      let msg=''
      if(win==='draw'){
        msg=`*🎮 DRAW!* 🤝\n\n${renderBoard(game.board)}\n\nGood game!\n\n${WATERMARK}`
      } else {
        const winnerIdx = win==='X' ? 0 : 1
        msg=`*🎮 ${win} WINS!* 🎉\n\nWinner: @${game.players[winnerIdx].split('@')[0]}\n\n${renderBoard(game.board)}\n\n${WATERMARK}`
      }
      delete games[jid]
      return sock.sendMessage(jid,{text:msg, mentions:game.players},{quoted:m})
    }

    // switch turn
    game.turn = game.turn==='X' ? 'O' : 'X'
    const nextIdx = game.turn==='X' ? 0 : 1
    return sock.sendMessage(jid,{
      text:`*🎮 Move: ${pos}*\n\nTurn: @${game.players[nextIdx].split('@')[0]} (${game.turn==='X'?'❌':'⭕'})\n\n${renderBoard(game.board)}\n\n${WATERMARK}`,
      mentions:[game.players[nextIdx]]
    },{quoted:m})
  }
}
