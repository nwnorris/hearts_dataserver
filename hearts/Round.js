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

module.exports = Round
