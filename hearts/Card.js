function Card(num) {
    this.suit = Math.floor(num / 13)
    this.value = num % 13
    this.points = 0
    this.num = num
    this.suitNames = ["clubs", "spades", "diamonds", "hearts"]
    this.valueNames = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

    if(this.suit == 3) {
      this.points = 1
    } else if (this.value == 10 && this.suit == 1) {
      this.points = 13
    }

    this.suitString = function() {
      return this.suitNames[this.suit]
    }

    this.shortSuitString = function() {
      return this.suitNames[this.suit][0]
    }

    this.valueString = function() {
      return this.valueNames[this.value]
    }

    this.shortName = function() {
      return this.valueString() + this.shortSuitString()
    }

    this.toString = function() {
      return this.shortName()
    }
}

module.exports = Card
