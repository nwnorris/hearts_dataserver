var suitNames = ["clubs", "spades", "diamonds", "hearts"]
var valueNames = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
var fs = require('fs')

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
      var j = Math.floor(Math.random() * i + 1)
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

  this.addMultiple = function(cards) {
    for(var i = 0; i < cards.length; i++) {
      this.cards.push(cards[i])
    }
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

  this.sort = function() {
    this.cards.sort(function(a, b) {
      if(a.num < b.num) return -1;
      if(a.num > b.num) return 1;
      return 0;
    })
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
  this.passedCards = false
  this.recievedPass = false
}

function Play(player, card) {
    this.player = player
    this.card = card
}

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

function Round() {
  this.tricks = []
  this.playerPoints = [0, 0, 0, 0]
  this.cardCounts = [0, 0, 0, 0]
  this.pointsBroken = false
  this.moon = false
  this.addTrick = function(trick) {
    this.playerPoints[trick.winner.player] += trick.points
    this.tricks.push(trick)
    if(!this.pointsBroken && trick.containsHearts) {
      this.pointsBroken = true
      console.log("[ALERT] Points have been broken!")
    }
  }
  this.moonPlayer = function() {
    for(var i = 0; i < this.playerPoints.length; i++) {
      if(this.playerPoints[i] == 26) {
        return i
      }
    }
    return -1
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
  this.filename = "games/hearts_game_" + Date.now()
  this.playerTurn = 0
  this.passType = -1
  this.activeTrick = new Trick()
  this.numPlayers = 4
  this.passedCards = new Map()
  this.roundPlayedCards = new Map()

  //Null values are functions that must be registered by the software using this API
  this.output = null
  this.onStart = null
  this.getPass = null
  this.onCompleteTrick = null
  this.onRoundEnd = null
  this.donePassing = null
  this.onMoon = null


  //Caches for incremental logging to CSV
  this.writeCache = []
  this.passCache = []


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
    for(var i = 0; i < this.players.length; i++){
      this.players[i].hand.sort()
    }
  }

  this.getPassedCards = function() {
    var out = []
    for (var i = 0; i < 4; i++) {
      out.push(this.passedCards[i])
    }
    return out
  }

  this.getPassTarget = function(pid) {
    switch(this.passType){
      case 0:
        //Left
        return (pid + 1) % 4
        break;
      case 1:
        //Right
        return (pid + 3) % 4
        break;
      case 2:
        //Across
        return (pid + 2) % 4
      case 4:
        //No pass
        return -1
    }
  }

  this.sortPlayers = function() {
    this.players.forEach(function(p) {
      p.hand.sort()
    })
  }

  //Once all players have passed their cards, we actually perform the pass
  this.executePass = function() {
    for(var i = 0; i < this.players.length; i++) {
      var pidTarget = this.getPassTarget(i)
      var cards = this.passedCards[i]
      for(var j = 0; j < cards.length; j++) {
        this.players[i].remove(cards[j])
        this.players[pidTarget].hand.addCard(cards[j])
      }
    }
  }

  this.recievePassedCards = function(pidGiver, pidTarget, cards) {
    this.players[pidGiver].passedCards = true
    this.passedCards[pidGiver] = cards
    this.writePass(pidGiver, cards)

    success = true
    for(var i = 0; i < this.players.length; i++) {
      if(!this.players[i].passedCards) {
        success = false
      }
    }

    if(success) {
      this.executePass()
      this.sortPlayers()
      this.csvWritePass()
      setTimeout(this.donePassing, 500)
    }
  }

  this.beginRound = function() {
    //Find 2 of clubs
    this.mode = 'ingame';
    for(var i = 0; i < this.players.length; i++) {
      if(this.players[i].hand.contains(0)) { // 2 of clubs
        this.playerTurn = i
        console.log("Player " + i + " has the 2 of clubs.")
        break
      }
    }
    this.currentTurn()
    this.onStart()

    for(var i = 0; i < this.players.length; i++) {
      this.players[i].passedCards = false
      this.players[i].recievedPass = false
    }
  }

  this.testMoon = function() {
    suit = 0
    for (var i = 0; i < this.players.length; i++) {
      this.players[i].hand.cards = []
      for(var j = 0; j < 13; j++) {
        this.players[i].hand.addCard(new Card(13 * i + j))
      }
      suit++;
    }
  }

  this.newRound = function() {
    this.csvWrite()
    this.rounds.push(new Round())
    this.deck = new Deck()
    this.deck.shuffle()
    this.deal()
    this.roundPlayedCards = new Map()
    //this.testMoon()
    this.passType = (this.passType + 1) % 4
    if(this.passType == 3) {
      //Skip pass phase, no pass.
      this.beginRound()
    } else {
      //Left/right/across pass
      this.mode = 'pass'
      this.getPass()
    }

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
    this.newRound();
  }

  this.moonDecision = function(pid, choice) {
    var round = this.rounds[this.rounds.length - 1]
    var mooner = round.moonPlayer()
    if(pid != mooner) {
      this.finishTrick()
    } else {
      //Valid moon
      if(choice == "add") {
        for(var i = 0; i < round.playerPoints.length; i++) {
          if(i != pid) {
            round.playerPoints[i] = 26
          }
        }
        round.playerPoints[pid] = 0
      } else if (choice == "subtract") {
        for(var i = 0; i < round.playerPoints.length; i++) {
          if(i != pid) {
            round.playerPoints[i] = 0
          }
        }
        round.playerPoints[pid] = -26
      }

      this.finishTrick()
    }
  }

  this.finishTrick = function() {
    var round = this.rounds[this.rounds.length - 1]
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
    }
  }

  this.canPlayCard = function(card) {
    return !(card.num in this.roundPlayedCards)
  }

  this.activeRound = function() {
    return this.rounds[this.rounds.length - 1]
  }

  this.playCard = function(card) {
    output(this.playerTurn + " plays " + card)
    this.writeAction(card.num)
    console.log(this.playerTurn + " plays " + card)

    this.activeRound().cardCounts[card.suit] += 1
    this.activeTrick.makePlay(this.playerTurn, card)
    this.rounds[this.rounds.length - 1]
    this.players[this.playerTurn].remove(card)
    this.roundPlayedCards[card.num] = 1
    this.nextPlayerTurn()

    if(this.activeTrick.completed()) {
      var round = this.currentRound()
      round.addTrick(this.activeTrick)
      var didMoon = this.rounds[this.rounds.length - 1].moonPlayer()
      if(didMoon >= 0) {
        this.onMoon(didMoon)
      } else {
        this.finishTrick()
      }
    }

    this.currentTurn()
  }

  this.getPlayableCards = function(pid) {
      var player = this.players[pid]
      var round = this.rounds[this.rounds.length - 1]
      var trick = this.activeTrick
      var playable = []
      if(this.mode == 'ingame') {
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
            //No suit of lead -- can play offsuit.
            playable = player.hand.cards
          }
        }
      } else if (this.mode == 'pass') {
        playable = player.hand.cards;
      }


      return playable
  }

  this.csvWrite = function() {
    if(this.writeCache.length > 0) {
      var data = this.writeCache.join("\n")
      var name = this.filename + "_" + this.rounds.length + ".csv"
      fs.writeFile(name, data, err => {
        if (err) {
          console.log("Unable to save to .csv", err)
        } else {
          console.log('Saved actions to ' + name)
          this.writeCache = []
        }
      })
    }
  }

  this.csvWritePass = function() {
    if(this.passCache.length > 0) {
      var data = this.passCache.join("\n")
      var name = this.filename + "_" + this.rounds.length + "_pass" + ".csv"
      fs.writeFile(name, data, err => {
        if (err) {
          console.log("Unable to save to .csv", err)
        } else {
          console.log('Saved passes to ' + name)
          this.passCache = []
        }
      })
    }
  }

  this.writePass = function(pidGiver, cards) {
    var row = []
    var playerHand = this.players[pidGiver].hand.cards
    playerHand.forEach(function(card) {
      row.push(card.num)
    })
    cards.forEach(function(card) {
      row.push(card.num)
    })

    this.passCache.push(row.join(','))
  }

  this.writeAction = function(cardNum) {
    var row = []
    var player = this.players[this.playerTurn]
    //Columns 0 thru 12, the player's hand
    for (var i = 0; i < 13; i++) {
      if(i < player.hand.cards.length) {
        row.push(player.hand.cards[i].num)
      } else {
        row.push(-1)
      }
    }

    //Columns 13 thru 18, player card played + player score
    for (var i = 0; i < 3; i++) {
      if(i < this.activeTrick.playedCards.length) {
        var play = this.activeTrick.playedCards[i]
        row.push(play.card.num)
        row.push(this.score[play.player])
      } else {
        row.push(-1)
        row.push(-1)
      }
    }

    //Current suit counts
    for (var i = 0; i < 4; i++) {
      row.push(this.rounds[this.rounds.length - 1].cardCounts[i])
    }

    //Player score and card played
    row.push(this.score[this.playerTurn])
    row.push(cardNum)

    out = row.join(',')
    this.writeCache.push(out)
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
