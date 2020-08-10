var express = require('express')
var bp = require('body-parser')
var path = require('path')
var app = express()
var http = require('http').createServer(app)
var port = 5000
var io = require('socket.io')(http)
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

function newGame() {
  activeGame = new game.Game()
  activeGame.registerOutput(sendLogMsg)
  activeGame.currentTurn()
}

//--SOCKET--//

io.on('connection', function(socket) {
  socket.on('player-connect', (id) => {
    if(players.length < 4) {
      players.push(id)
      console.log("Player " + players.length + " connected: " + id)
      socket.emit('game-message', "Welcome to the game.")
      if(players.length == 1) {
        socket.emit('game-message', "The game begins.")
        newGame()
      }
    }
  })

  socket.on('play-card', (card) => {
    if(card != undefined) {
      playCard(card.card)
    }
  })
})



//--ROUTES--//
app.get("/", function(req, res) {
  res.send("Hey")
  newGame()
})

app.post("/game/new", function(req, res) {
  newGame()
  res.status(200).send()
})

app.get("/game", function(req, res) {
  res.render('game.ejs')
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
