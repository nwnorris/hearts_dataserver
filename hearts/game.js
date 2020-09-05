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
  this.contains = function(id) {
    for(var i = 0; i < this.cards.length; i++) {
      if(this.cards[i].num == id) return true
    }
    return false
  }
  this.indexOf = function(id) {
    for(var i = 0; i < this.cards.length; i++) {
      if(this.cards[i].num == id) return i
    }
    return -1
  }
  this.clear = function() {
    this.cards = []
  }
  this.remove = function(card) {
    var result = this.indexOf(card.num)
    var c = this.cards.splice(result, 1)
  }
}

function Player(id, name) {
  this.id = id
  this.name = name
  this.hand = new Hand()
  this.hasCard = function(id) {
    return this.hand.indexOf(id)
  }
  this.getCard = function(index) {
    return this.hand.cards[index]
  }
  this.remove = function(card) {
    this.hand.remove(card)
  }
}

function Play(player, card) {
    this.player = player
    this.card = card
}

function Trick() {
  this.points = 0
  this.playedCards = []
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
  }
  this.completed = function() {
    return this.playedCards.length == 4 ? true : false
  }
}

function Round() {
  this.tricks = []
  this.playerPoints = [0, 0, 0, 0]
  this.pointsBroken = false
  this.addTrick = function(trick) {
    this.playerPoints[trick.winner.player] += trick.points
    this.tricks.push(trick)
    if(!this.pointsBroken && trick.containsHearts) {
      this.pointsBroken = true
      console.log("[ALERT] Points have been broken!")
    }
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
  this.onStart = null
  this.onCompleteTrick = null
  this.onRoundEnd = null
  this.log = function(msg) {
    if(output != null) {
      output(msg)
    }
  }
  this.mode = 'pregame'
  this.tricksPerRound = this.deck.size() / this.numPlayers

  this.nextPlayerTurn = function() {
    this.playerTurn += 1
    this.playerTurn %= 4
  }

  this.getPlayerId = function(name) {
    for(var i = 0; i < this.players.length; i++) {
      if(this.players[i].name == name) {
        return i;
      }
    }
  }

  this.currentRound = function() {
    return this.rounds[this.rounds.length - 1]
  }

  this.currentTurn = function() {
    output("It is player " + this.playerTurn + "'s turn.")
  }

  this.deal = function() {
    for(var i = 0; i < this.players.length; i++){
      this.players[i].hand.clear()
    }
    this.deck.deal(this.players)
  }

  this.newRound = function() {
    this.rounds.push(new Round())
    this.deck = new Deck()
    this.deal()
    //Find 2 of clubs
    for(var i = 0; i < this.players.length; i++) {
      if(this.players[i].hand.contains(0)) { // 2 of clubs
        this.playerTurn = i
        console.log("Player " + i + " has the 2 of clubs.")
        break
      }
    }
    this.currentTurn()
  }

  this.registerOutput = function(callback) {
    output = callback
  }

  this.status = function() {
    var playerNames = []
    for(var i = 0; i < this.players.length; i++) {
      playerNames.push(this.players[i].name)
    }
    return({mode: this.mode, turn: this.playerTurn, players: playerNames, score: this.score, turn: this.playerTurn})
  }

  this.getHand = function(pid) {
    if(pid < this.players.length) {
      return this.players[pid].hand.cards;
    } else {
      return undefined;
    }
  }

  this.addPlayer = function(playerName) {
    var success = true
    if(this.players.length < 4) {
      var id = this.players.length
      var player = new Player(id, playerName)
      this.players.push(player)
      output("Player joined: " + player.name)
      success = true
      if(this.players.length == 4) {
        this.start()
      }
    }

    return success;

  }

  this.start = function() {
    output("Game is beginning!")
    this.mode = 'ingame';
    this.newRound();
    if(this.onStart != null) {
      this.onStart()
    }
  }

  this.playCard = function(card) {
    output(this.playerTurn + " plays " + card)
    console.log(this.playerTurn + " plays " + card)
    this.activeTrick.makePlay(this.playerTurn, card)
    this.players[this.playerTurn].remove(card)
    console.log("Player " + this.playerTurn + " now has " + this.players[this.playerTurn].hand.cards.length + " cards in hand.")
    this.nextPlayerTurn()

    if(this.activeTrick.completed()) {
      var round = this.currentRound()
      round.addTrick(this.activeTrick)
      this.onCompleteTrick(this.activeTrick.winner.player)
      this.playerTurn = this.activeTrick.winner.player
      this.activeTrick = new Trick()
      output("Completed trick " + round.size() + "/" + this.tricksPerRound)
      output("Player " + this.playerTurn + " is on the lead.")

      if(round.size() == this.tricksPerRound) {
        //End of round
        for(var i = 0; i < this.numPlayers; i++) {
          this.score[i] += round.playerPoints[i]
        }
        if(this.onRoundEnd){
          this.onRoundEnd()
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

  this.getPlayableCards = function(pid) {
      var player = this.players[pid]
      var round = this.rounds[this.rounds.length - 1]
      var trick = this.activeTrick
      var playable = []
      //Check if this player is on the lead
      if(trick.playedCards.length == 0 && player.id == this.playerTurn) {
        //Must play 2 of clubs on first lead of round
        if(round.tricks.length == 0) {
          var clubIndex = player.hasCard(0)
          if(clubIndex >= 0) {
            playable.push(player.getCard(clubIndex))
          }
        } else {
          //Not first round, can lead any suit (excluding hearts if points aren't broken)
          if(round.pointsBroken) {
            playable = player.hand.cards
          } else {
            for(var i = 0; i < player.hand.cards.length; i++) {
              var card = player.hand.cards[i]
              if(card.suit < 3) {
                playable.push(card)
              }
            }
            //If all player has is hearts, can lead them.
            if(playable.length == 0) {
              playable = player.hand.cards;
            }
          }

        }
      } else {
        //Not on the lead -- must follow lead suit if possible
        var hasPlay = false
        for(var i = 0; i < player.hand.cards.length; i++) {
          var card = player.hand.cards[i]
          if(card.suit == trick.leadSuit) {
            playable.push(card)
            hasPlay = true
          }
        }
        if(!hasPlay) {
          console.log("No cards of lead suit. Offsuit play allowed!")
          playable = player.hand.cards
        }
      }

      return playable
  }

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
