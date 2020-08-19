var express = require('express')
var bp = require('body-parser')
var path = require('path')
var app = express()
var http = require('http').createServer(app)
var port = 5000
var io = require('socket.io')(http)
var mobile = require('is-mobile')

app.use(bp.urlencoded({extended: true}))
app.use(bp.json())
app.set('view engine', 'ejs')
app.use("/src", express.static(path.join(__dirname, 'src')))

var game = require('./hearts/game.js')
var players = []
var activeGame = null

function sendLogMsg(msg) {
  io.emit('game-message', msg);
}

function playCard(card) {
  var card = new game.Card(card)
  activeGame.playCard(card)
}

function startGame() {
  sendLogMsg("Game is beginning!")
  activeGame.start();
  io.emit("update", "")
}

function newGame() {
  activeGame = new game.Game()
  activeGame.registerOutput(sendLogMsg)
  activeGame.currentTurn()
}

//--SOCKET--//

io.on('connection', function(socket) {
  socket.on('player-connect', (id) => {
    // if(players.length < 4) {
    //   players.push(id)
    //   console.log("Player " + players.length + " connected: " + id)
    //   socket.emit('game-message', "Welcome to the game.")
    //   if(players.length == 1) {
    //     socket.emit('game-message', "The game begins.")
    //     newGame()
    //   }
    // }
  })

  socket.on('play-card', (card) => {
    if(card != undefined) {
      playCard(card.card)
    }
  })
})

//--ROUTES--//
app.get("/", function(req, res) {
  if(mobile(req)) {
    res.redirect("/game")
  } else {
    res.render('game_view.ejs')
  }
})

app.post("/game/new", function(req, res) {
  newGame()
  res.status(200).send()
})

app.post("/game/join", function(req, res) {
  players.push(req.body.username);
  res.send(players.length)
})

app.get("/game", function(req, res) {
  res.render('game.ejs')
})

app.get("/game/status", function(req, res) {
  console.log("Got status request.")
  res.json(activeGame.status())
})

app.post("/game/player", function(req, res) {
  success = false
  if(players.length < 4) {
    console.log("Player joined: " + req.body.pid);
    sendLogMsg("Player joined: " + req.body.pid)
    players.push(req.body.pid)
    success = true;
    if(players.length == 4) {
      startGame()
    }
  }
  res.status(200).json({valid: success, pid: req.body.pid})
})

app.post("/game/player/hand", function(req, res) {
  var pid = players.indexOf(req.body.pid);
  console.log(req.body)
  console.log("Sending hand to player " + pid)
  if(pid >= 0) {
    res.status(200).json(activeGame.getHand(pid));
  } else {
    res.status(300).json({})
  }

})

app.post("/", function(req, res) {
  try {
    var played_card = req.body.card
    if(played_card != undefined) {
      playCard(played_card)
      res.status(200).send()
    } else {
      console.log("Malformed body. Unable to get card.")
      res.status(400).send()
    }

  } catch (e) {
    console.log(e)
    res.status(400).send()
  }
})

http.listen(port, () => console.log("Server online on port " + port))
newGame()
