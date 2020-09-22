function Agent(pid, game, playCard) {
  this.pid = pid
  this.game = game
  this.hand = []
  this.playCard = playCard

  this.alertTurn = function(msg) {
    if(msg.pid == this.pid) {
      this.getMove()
    }
  }

  this.update = function() {
    this.hand = game.players[this.pid].hand.cards
  }

  this.getPass = function() {
    this.update()
    var target = this.game.getPassTarget(this.pid)
    var cards = []
    for(var i = 0; i < 3; i++) {
      cards.push(this.hand[i])
    }
    this.game.recievePassedCards(this.pid, target, cards)
  }

  this.getMove = function() {
    var row = []
    //Columns 0 thru 12, the player's hand
    for (var i = 0; i < 13; i++) {
      if(i < this.hand.length) {
        row.push(parseInt(this.hand[i].num))
      } else {
        row.push(-1)
      }
    }

    //Columns 13 thru 18, player card played + player score
    for (var i = 0; i < 3; i++) {
      if(i < this.game.activeTrick.playedCards.length) {
        var play = this.game.activeTrick.playedCards[i]
        row.push(play.card.num)
        row.push(this.game.score[play.player])
      } else {
        row.push(-1)
        row.push(-1)
      }
    }

    //Current suit counts
    for (var i = 0; i < 4; i++) {
      row.push(this.game.rounds[this.game.rounds.length - 1].cardCounts[i])
    }

    //Player score and card played
    row.push(this.game.score[this.pid])

    this.calculateMove(row)
  }

  this.calculateMove = function(x) {
    const { spawn } = require('child_process')
    console.log(JSON.stringify(x))
    const pyProg = spawn('python3', ['./model/get_move.py', JSON.stringify(x)], );
    var tmpThis = this
    pyProg.stdout.on('data', function(data) {
        var indexToPlay = parseInt(data) //Neural net response: what index card should I select?
        var card = tmpThis.hand[indexToPlay]
        tmpThis.playCard(tmpThis.pid, card.num)
    });

    pyProg.stderr.on('data', function(data) {
      console.log(data.toString())
    })

    pyProg.on('exit', function(code) {
    })
  }
}

module.exports = Agent;
