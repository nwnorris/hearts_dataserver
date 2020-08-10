var suitNames = ["clubs", "spades", "diamonds", "hearts"]
var valueNames = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

function Card(num) {
    this.suit = Math.floor(num / 13)
    this.value = num % 13
    this.points = 0
    this.num = num

    if(this.suit == 3) {
      this.points = 1
    } else if (this.value == 10 && this.suit == 1) {
      this.points = 13
    }

    this.suitString = function() {
      return suitNames[this.suit]
    }

    this.shortSuitString = function() {
      return suitNames[this.suit][0]
    }

    this.valueString = function() {
      return valueNames[this.value]
    }

    this.shortName = function() {
      return this.valueString() + this.shortSuitString()
    }

    this.toString = function() {
      return this.shortName()
    }
}

function Deck() {
  this.cards = []
  for (var i = 0; i < 52; i++) {
    this.cards.push(new Card(i))
  }

  this.shuffle = function() {
    var i = this.cards.length - 1
    for(i; i > 0; i--){
      var j = Math.floor(Math.random() * i)
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

function Hand() {
  this.cards = []
  this.addCard = function(card) {
    this.cards.push(card)
  }
  this.toString = function() {
    return "Hand with " + this.cards.length + " cards in it."
  }
}

function Player(id) {
  this.id = id
  this.hand = new Hand()
}

function Play(player, card) {
    this.player = player
    this.card = card
}

function Trick() {
  this.points = 0
  this.playedCards = []
  this.winner = undefined
  this.makePlay = function(player, card) {
    var p = new Play(player, card)
    this.playedCards.push(p)
    this.points += card.points
    if(this.winner == undefined || (card.suit == this.winner.card.suit && card.value > this.winner.card.value)) {
      this.winner = p
    }
  }
  this.completed = function() {
    return this.playedCards.length == 4 ? true : false
  }
}

function Round() {
  this.tricks = []
  this.playerPoints = [0, 0, 0, 0]
  this.addTrick = function(trick) {
    this.playerPoints[trick.winner.player] += trick.points
    this.tricks.push(trick)
  }
  this.size = function() {
    return this.tricks.length
  }
}

function Game() {
  this.players = []
  this.rounds = []
  this.score = [0, 0, 0, 0]
  this.deck = new Deck()
  this.playerTurn = 0
  this.activeTrick = new Trick()
  this.numPlayers = 4
  this.output = null
  this.log = function(msg) {
    if(output != null) {
      output(msg)
    }
  }
  this.tricksPerRound = this.deck.size() / this.numPlayers
  this.nextPlayerTurn = function() {
    this.playerTurn += 1
    this.playerTurn %= 4
  }
  this.currentRound = function() {
    return this.rounds[this.rounds.length - 1]
  }

  this.currentTurn = function() {
    output("It is player " + this.playerTurn + "'s turn.")
  }

  this.deal = function() {
    this.deck.deal(this.players)
  }
  this.newRound = function() {
    this.rounds.push(new Round())
    this.deck = new Deck()
    this.deal()
  }
  this.registerOutput = function(callback) {
    output = callback
  }

  this.playCard = function(card) {
    output(this.playerTurn + " plays " + card)

    this.activeTrick.makePlay(this.playerTurn, card)

    this.nextPlayerTurn()

    if(this.activeTrick.completed()) {
      var round = this.currentRound()
      round.addTrick(this.activeTrick)
      output("Completed trick " + round.size() + "/" + this.tricksPerRound)

      this.activeTrick = new Trick()

      if(round.size() == this.tricksPerRound) {
        //End of round
        for(var i = 0; i < this.numPlayers; i++) {
          this.score[i] += round.playerPoints[i]
        }
        this.newRound()
        output("End of round. Points stand thusly:")
        for(var i = 0; i < this.numPlayers; i++) {
          output("Player " + i + ": " + this.score[i])
        }
      }
    }
    this.currentTurn()

  }

  for(var i = 0; i < 4; i++) {
    this.players.push(new Player(i))
  }
  this.newRound()

}

module.exports = {
  Play: Play,
  Trick: Trick,
  Card: Card,
  Round: Round,
  Deck: Deck,
  Hand: Hand,
  Player: Player,
  Game: Game
}
