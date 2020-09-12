var express = require('express')
var bp = require('body-parser')
var path = require('path')
var fs = require('fs')
const { uuid } = require('uuidv4')
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
var sessions = new Map()
var activeGame = null

var host = JSON.parse(fs.readFileSync('./config.json', {encoding: 'utf8', flag: 'r'})).host

function sendLogMsg(msg) {
  io.emit('game-message', msg);
}

function playCard(player, cardNum) {
  var card = new game.Card(cardNum)
  activeGame.playCard(card)
  io.emit('play-card', {card: cardNum, player: activeGame.playerTurn});
  sendLogMsg(player + " plays " + card.shortName())
  setTimeout(function() {
    sendTurn()
  }, 30)
}

function sendTurn() {
  io.emit("turn", {pid: activeGame.playerTurn, leadSuit: activeGame.activeTrick.leadSuit})
}

function sendScore() {
  var data = {
    players: []
  }
  for(var i = 0; i < activeGame.players.length; i++){
    var p = activeGame.players[i]
    data.players.push({id: p.id, name: p.name, score: activeGame.score[i]})
  }
  io.emit('score-update', data)
}

function startGame() {
  activeGame.start();
}

var onStart = function() {
  setTimeout(function() {
    io.emit("update", "")
    sendScore()
    sendTurn()
  }, 500);
}

var onRoundEnd = function() {
  sendScore()
  onStart()
}

var trickDone = function(winner) {
  setTimeout(function() {
    io.emit("trick-complete", {'winner': winner})
  }, 1000)
}

function newGame() {
  activeGame = new game.Game()
  activeGame.registerOutput(sendLogMsg)
  activeGame.onStart = onStart
  activeGame.onCompleteTrick = trickDone
  activeGame.onRoundEnd = onRoundEnd
  activeGame.currentTurn()
}

function debugPlayers(numPlayers) {
  for(var i = 0; i < numPlayers; i++) {
    players.push("debug" + (i+1))
  }
  startGame()
}

function newSession() {
  var session = uuid()
  sessions[session] = 1
  return session
}

//--ROUTES--//
app.get("/", function(req, res) {
  if(mobile(req)) {
    res.redirect("/game")
  } else {
    res.render('game_view.ejs', {host: host})
  }
})

app.post("/game/new", function(req, res) {
  newGame()
  res.status(200).send()
})

app.get("/game", function(req, res) {
  res.render('game.ejs', {host: host})
})

app.post("/game/play", function(req, res) {
  var player = parseInt(req.body.player);
  var card = parseInt(req.body.card);
  if(card >= 0 && card < 52) {
    console.log("Recieved post to /game/play for card: " + card)
    playCard(player, card)
  } else {
    console.log("Error processing play request from player " + player + " for card: " + card)
  }
  res.status(200).send()
})

app.post("/game/status", function(req, res) {
  console.log("Got status request.")
  if(req.body.session in sessions || req.body.game_view == "true") {
    res.status(200).json(activeGame.status())
  } else {
    console.log("Invalid session request.")
    res.status(401).send()
  }
})

app.get("/game/view/status", function(req, res) {
  var status = {"mode" : activeGame.status().mode}
  res.status(200).json(status)
})

app.post("/game/player", function(req, res) {
  var success = activeGame.addPlayer(req.body.pid)
  var pid = activeGame.players.length - 1
  var session = newSession()
  res.status(200).json({valid: success, player: req.body.pid, pid: pid, session: session})
})

app.post("/game/player/hand", function(req, res) {
  if(req.body.session in sessions) {
    var pid = activeGame.getPlayerId(req.body.pid);
    console.log("Hand request from: " + req.body.pid)
    if(pid >= 0) {
      res.status(200).json(activeGame.getHand(pid));
    } else {
      res.status(300).json({})
    }
  } else {
    res.status(300).json({})
  }
})

app.post("/game/player/playable", function(req, res) {
  console.log(req.body.pid + " requested playable card set.")
    if(req.body.pid >= 0 && req.body.pid < 4) {
      var cards = activeGame.getPlayableCards(req.body.pid)
      res.status(200).json(cards)
    } else {
      res.status(300).json({})
    }
})

http.listen(port, () => console.log("Server online on port " + port))
newGame()
