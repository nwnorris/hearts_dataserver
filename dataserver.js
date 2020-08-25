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

function playCard(player, cardNum) {
  var card = new game.Card(cardNum)
  io.emit('play-card', {card: cardNum, player: activeGame.playerTurn});
  sendLogMsg(player + " plays " + card.shortName())
  activeGame.playCard(card)
  setTimeout(function() {
    io.emit("turn", activeGame.playerTurn)
  }, 30)

  console.log("It is " + activeGame.playerTurn + "'s turn.")
}

function startGame() {
  activeGame.start();
}

var onStart = function() {
  io.emit("update", "")
  io.emit("turn", activeGame.playerTurn)
  console.log("It is " + activeGame.playerTurn + "'s turn.'")
}

function newGame() {
  activeGame = new game.Game()
  activeGame.registerOutput(sendLogMsg)
  activeGame.onStart = onStart
  activeGame.currentTurn()
}

function debugPlayers(numPlayers) {
  for(var i = 0; i < numPlayers; i++) {
    players.push("debug" + (i+1))
  }
  startGame()
}

//--SOCKET--//
io.on('connection', function(socket) {
  // socket.on('play-card', (card) => {
  //   if(card != undefined) {
  //     playCard(card.player, card.card)
  //   }
  // })
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

app.get("/game", function(req, res) {
  res.render('game.ejs')
})

app.post("/game/play", function(req, res) {
  var player = parseInt(req.body.player);
  var card = parseInt(req.body.card);
  if(card) {
    console.log("Recieved post to /game/play for card: " + card)
    playCard(player, card)
  }
  res.status(200).send()
})

app.get("/game/status", function(req, res) {
  console.log("Got status request.")
  res.json(activeGame.status())
})

app.post("/game/player", function(req, res) {
  var success = activeGame.addPlayer(req.body.pid)
  res.status(200).json({valid: success, pid: req.body.pid, pnum: activeGame.players.length - 1})
  // if(activeGame.players.length == 3) {
  //   startGame()
  // }
})

app.post("/game/player/hand", function(req, res) {
  var pid = activeGame.getPlayerId(req.body.pid);
  console.log("Hand request from: " + req.body.pid)
  if(pid >= 0) {
    res.status(200).json(activeGame.getHand(pid));
  } else {
    res.status(300).json({})
  }

})

http.listen(port, () => console.log("Server online on port " + port))
newGame()
