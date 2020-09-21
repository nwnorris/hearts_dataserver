var Play = require("./Play")

function Trick() {
  this.points = 0
  this.playedCards = []
  this.suitCounts = [0, 0, 0, 0]
  this.winner = undefined
  this.leadSuit = undefined
  this.containsHearts = false
  this.makePlay = function(player, card) {
    var p = new Play(player, card)
    this.playedCards.push(p)
    this.points += card.points
    if(this.winner == undefined || (card.suit == this.winner.card.suit && card.value > this.winner.card.value)) {
      this.winner = p
    }
    if(this.leadSuit == undefined) {
      this.leadSuit = card.suit
    }
    if(card.suit == 3) {
      this.containsHearts = true
    }
    this.suitCounts[card.suit] += 1
  }
  this.completed = function() {
    return this.playedCards.length == 4 ? true : false
  }
}

module.exports = Trick
