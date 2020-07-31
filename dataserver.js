var express = require('express')
var bp = require('body-parser')
var app = express()
var port = 5000
app.use(bp.json())

var game = require('./hearts/game.js')

var activeGame = new game.Game()

function playCard(card) {
  var card = new game.Card(card)
  activeGame.playCard(card)
}

//--ROUTES--//

app.get("/", function(req, res) {
  res.send("Hey")
  newGame()
})

app.post("/game/new", function(req, res) {
  newGame()
  res.status(200).send()
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

app.listen(port, () => console.log("Server online on port " + port))
