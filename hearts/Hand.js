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

module.exports = Hand
