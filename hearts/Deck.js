var Card = require("./Card")

function Deck() {
  this.cards = []
  for (var i = 0; i < 52; i++) {
    this.cards.push(new Card(i))
  }

  this.shuffle = function() {
    var i = this.cards.length - 1
    var l = i
    for(i; i >= 0; i--){
      var j = Math.floor(Math.random() * (i + 1))
      var temp = this.cards[i]
      this.cards[i] = this.cards[j]
      this.cards[j] = temp
    }
  }

  this.deal = function(players) {
    currentPlayer = 0
    while(this.cards.length > 0) {
      players[currentPlayer].hand.addCard(this.cards.pop())
      currentPlayer += 1
      currentPlayer %= players.length
    }
  }

  this.size = function() {
    return this.cards.length
  }
}

module.exports = Deck
