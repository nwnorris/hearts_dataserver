var express = require('express')
var bp = require('body-parser')
var path = require('path')
var fs = require('fs')
var uuid = require('uuid')
var app = express()
var http = require('http').createServer(app)
var port = 5000
var io = require('socket.io')(http)
var mobile = require('is-mobile')
var Agent = require("./Agent")

app.use(bp.urlencoded({extended: true}))
app.use(bp.json())
app.set('view engine', 'ejs')
app.use("/src", express.static(path.join(__dirname, 'src')))

var game = require('./hearts/game.js')
var players = []
var sessions = new Map()
var activeGame = null
agents = []

var host = JSON.parse(fs.readFileSync('./config.json', {encoding: 'utf8', flag: 'r'})).host
var agentNames = ["Artian", "Treshmek", "Pulrus", "Sugnam", "Xarviel", "Guhe", "Ornist"]
function sendLogMsg(msg) {
  io.emit('game-message', msg);
}

function playCard(player, cardNum) {
  var card = new game.Card(cardNum)
  if(activeGame.canPlayCard(card)) {
    io.emit('play-card', {card: cardNum, player: activeGame.playerTurn});
    activeGame.playCard(card)
    //sendLogMsg(player + " plays " + card.shortName())
    setTimeout(function() {
      sendTurn()
    }, 30)
  }
}

function sendTurn() {
  var msg = {pid: activeGame.playerTurn, leadSuit: activeGame.activeTrick.leadSuit}
  io.emit("turn", msg)
  agents.forEach(function(a) {
    a.alertTurn(msg)
  })
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

function sendUpdate() {
  io.emit("update", "")
  agents.forEach(function(a) {
    a.update()
  })

}

var onStart = function() {
  setTimeout(function() {
    sendUpdate()
    sendScore()
    sendTurn()
  }, 500);
}

var onRoundEnd = function() {
  sendScore()
}

var trickDone = function(winner) {
  setTimeout(function() {
    io.emit("trick-complete", {'winner': winner})
  }, 1000)
}

var getPass = function() {
  //sendUpdate()
  targets = []
  for(var i = 0; i < 4; i++) {
    targets.push(activeGame.getPassTarget(i))
  }
  setTimeout(function() {
    io.emit("get-pass", {'targets' : targets})
    agents.forEach(function(a) {
      a.getPass()
    })
  }, 500)
}

var didMoon = function(pid) {
  setTimeout(function() {
    io.emit("moon", {'pid' : pid})
  }, 500);
}

var donePassing = function() {
  var cards = activeGame.getPassedCards()
  io.emit("recieve-pass", {'cards': cards})
  setTimeout(function() {
    activeGame.beginRound()
  }, 500)
}

var onGameEnd = function() {
  console.log("Showing end game!")
  var score = activeGame.finalScore
  io.emit("game-end", {'score' : score})
}

var onBeginGame = function() {
  sendScore()
}

function newGame() {
  activeGame = new game.Game()
  activeGame.registerOutput(sendLogMsg)
  activeGame.onStart = onStart
  activeGame.onCompleteTrick = trickDone
  activeGame.onRoundEnd = onRoundEnd
  activeGame.getPass = getPass
  activeGame.donePassing = donePassing
  activeGame.onMoon = didMoon
  activeGame.onGameEnd = onGameEnd
  activeGame.onBeginGame = onBeginGame
  activeGame.currentTurn()
}

function debugPlayers(numPlayers) {
  for(var i = 0; i < numPlayers; i++) {
    players.push("debug" + (i+1))
  }
  startGame()
}

function newSession() {
  var session = uuid.v4()
  sessions[session] = 1
  return session
}

function addAI() {
  var a = new Agent(activeGame.players.length, activeGame, playCard)
  var name = agentNames[Math.floor(Math.random() * agentNames.length)]
  activeGame.addPlayer(name)
  agents.push(a)
}

//--ROUTES--//
app.get("/", function(req, res) {
  res.render('game.ejs', {host: host})
})

app.post("/game/new", function(req, res) {
  newGame()
  res.status(200).send()
})

app.get("/game", function(req, res) {
  res.render('game_view.ejs', {host: host})
})

app.post("/game/play", function(req, res) {
  var player = parseInt(req.body.player);
  var card = parseInt(req.body.card);
  if(card >= 0 && card < 52) {
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

  if(activeGame.players.length == 1) {
    addAI()
    addAI()
    addAI()
  }
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

app.post("/game/player/pass", function(req, res) {
  console.log("Got pass request from player " + req.body.pid + ", passing to " + req.body.target)
  var pid = req.body.pid
  var target = req.body.target
  var cards = []
  for (var i = 0; i < req.body.cards.length; i++) {
    cards.push(new game.Card(req.body.cards[i]))
  }

  activeGame.recievePassedCards(pid, target, cards)
  res.status(200)
})

app.post("/game/player/pass/target", function(req, res) {
  var target = activeGame.getPassTarget(req.body.pid)
  console.log("Got pass target request from player " + req.body.pid)
  res.status(200).json({target: target})
})

app.post("/game/player/moon", function(req, res) {
  var choice = req.body.moonChoice;
  res.status(200)
  activeGame.moonDecision(req.body.pid, choice)
})

http.listen(port, () => console.log("Server online on port " + port))
newGame()
