var socket = io();
var ch = 0;
var cw = 0;
var suitNames = ["C", "S", "D", "H"]
var valueNames = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
var maxMessages = 8
var playerNames = ["", "", "", ""]
var SERVER_URL = ""

socket.on('game-message', (msg) => {
	var log = document.getElementsByClassName("game_log")[0];
	var p = document.createElement("P")
	var text = document.createTextNode(msg)
	p.append(text)
	log.appendChild(p)
	if($(".game_log").children().length >= maxMessages) {
		for (var i = 0; i <= $(".game_log").children().length - maxMessages; i++){
			var item = $(".game_log").children()[i]
			$(item).fadeOut()
			setTimeout(function(){$(item).remove()}, 500)
		}
	}
})

socket.on('play-card', (msg) => {
	var cardNum = msg.card;
	var cardPlayer = msg.player;
	addCard(cardNum);
	animateIn($("#" + cardNum), cardPlayer);
	console.log(msg)
})

socket.on('trick-complete', (msg) => {
	var winPlayer = msg.winner;
	var playerCoords = getPositionCoordinates(winPlayer)
	$(".card").each(function() {
		$(this).css("top", playerCoords.y);
		$(this).css("left", playerCoords.x)
	})
	setTimeout(function() {
		$(".card").fadeOut();
	}, 250);
	setTimeout(function() {
		$(".card").remove();
	}, 500);
})

socket.on('score-update', (msg) => {
	updatePlayerInfo(msg.players)
	if(localStorage) {
		localStorage['players'] = JSON.stringify(msg.players)
	}

	layoutNames()
	$(".player-info").fadeIn()

})

function updatePlayerInfo(players){
	for(var i = 0; i < players.length; i++){
		var p = players[i]
		playerNames[i] = p.name
		$("#pname_" + p.id).text(p.name)
		$("#pscore_" + p.id).text(p.score)
	}
}

function ntoc(n) {
	var suit = Math.floor(n/13)
	var value = n % 13
	return valueNames[value] + suitNames[suit]
}

function addCard(cardId) {
	var card = $('<div class="card enabled" id="' + cardId + '"></div>"')
	var link = "url(src/img/cards/" + ntoc(cardId) + ".png)"
	card.css("background-image", link)
	card.css("width", cw + "px")
	card.css("height", ch + "px")
	$(".card_container").append(card)
}

function getPositionCoordinates(position) {
	x = 0
	y = 0
	switch(position) {
		case 0:
			x = $(window).width() / 2
			y = $(window).height() - (ch/2)
			break;
		case 1:
			x = ch / 2
			y = $(window).height() / 2
			break;
		case 2:
			x = $(window).width() / 2
			y = (ch / 2)
			break;
		case 3:
			x = $(window).width() - (ch /2)
			y = $(window).height() / 2
			break;
		}

	var xPadding = -1 * $(document).width() * 0.05
	return {x : (x + xPadding), y: y}
}

function animateIn(card, pnum) {
	var position = pnum
	var coords = getPositionCoordinates(position)
	console.log("Animating in card at position: " + pnum)
	card.toggleClass("played")
	card.css("transition", "all 0.2s")
	card.css("bottom", "")
	card.css("top", "")
	card.css("left", "")
	card.css("top", coords.y + "px")
	card.css("left", coords.x + "px")
	if(position % 2 == 0) {
		card.css("transform", "rotate(180deg)")
	} else {
		card.css("transform", "rotate(270deg)")
	}
}

function animateOut(card, pnum) {
	//Convert absolute player ID to relative player position, then get position coords
	var position = getOffsetPosition(pnum)
	var coords = getPositionCoordinates(position)
	card.css("top", coords.y + "px")
	card.css("left", coords.x + "px")
}

function getOffsetPosition(playerNumber) {
	//Assume that I sit at seat 0, and seats increment clockwise.
	console.log("getting offset (" + offset + ") for player " + playerNumber)
	return (playerNumber + offset) % 4
}

function layoutCards() {
	var width = $(".card_container").width() * 0.9
	var padding = $(".card_container").width() * 0.1

	ch = $(".card_container").height() * 0.3
	cw = ch / 1.523 // Card size ratio

	$(".card").css("width", cw + "px")
	$(".card").css("height", ch + "px")
}

function layoutNames() {
	$(".player-info").each(function() {
		var id = parseInt($(this).find('.pname').attr('id').substring(6))
		var coords = getPositionCoordinates(id)
		var xPadding = (cw * 0.3)
		var yPadding = (ch * 0.25)
		var w = $(this).width()
		var h = $(this).height()
		switch(id) {
			case 0:
				coords.x = coords.x + w
		  	break;
			case 1:
				coords.y = coords.y + h
				coords.x = coords.x + w
				break;
			case 2:
				coords.x = coords.x + w
				break;
			case 3:
				coords.y = coords.y + h
				coords.x = coords.x + w
				break;
		}
		coords.x -= xPadding
		coords.y -= yPadding
		$(this).css("top", coords.y)
		$(this).css("left", coords.x)
		$(this).css("width", $(this).find('.pname').width() + 50 + "px")
	})
}

function clearStorage() {
	localStorage['players'] = "undefined"
}

function getStatus() {
	$.ajax({
		method: "GET",
		url: SERVER_URL + "/game/view/status",
		data: {
			"session" : 3
		}
	}).done(function(response) {
		if(response.mode == "pregame") {
			clearStorage()
		}
	}).fail(function(response){
		clearStorage()
	})
}

$(window).resize(function() {
	layoutCards()
	layoutNames()
})

$(document).ready(function() {
	SERVER_URL = "http://" + $(".server_url").text()
	layoutCards()
	layoutNames()
	getStatus()
	$(".card_container").css("display", "block")
	if(localStorage && localStorage['players'] != "undefined") {
		var players = JSON.parse(localStorage['players'])
		updatePlayerInfo(players)
		$(".player-info").fadeIn()
	}

})
