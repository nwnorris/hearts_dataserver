var socket = io();

var player = "";
var pnum = -1;
var offset = -1;
var suitNames = ["C", "S", "D", "H"]
var valueNames = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
var myTurn = false
var trickCards = 0
var ch = 0
var cw = 0

function animatePlay(card) {
	var y = card.height() * 1.2 * -1
	var x = ($(window).width() / 2) - (card.width()/2)
	var dx = x - card.position().left
	card.css("transform", "translateY(" + y + "px) " + "translateX(" + dx + "px) rotate(180deg)")
}

function animateIn(card, pnum) {
	var position = getOffsetPosition(pnum)
	var endX = 0
	var endY = 0
	var startX = 0
	var startY = 0

	switch(position) {
		case 0:
			endX = $(window).width() / 2
			startX = endX
			endY = $(window).height() - (ch * 2)
			startY = endY
			break;
		case 1:
			endX = ch
			startX = endX
			endY = $(window).height() - (ch * 3.5)
			startY = endY
			break;
		case 2:
			endX = $(window).width() / 2
			startX = endX
			endY = ch
			startY = endY
			break;
		case 3:
			endX = $(window).width() - ch
			startX = endX
			endY = $(window).height() - (ch * 3.5)
			startY = endY
			break;
		}
		console.log("Animating in card from position " + position + " at pos " + position + ": (" + endX + "," + endY + ")")

	card.toggleClass("played")
	card.css("transition", "all 0.2s")
	card.css("bottom", "")
	card.css("top", "")
	card.css("left", "")
	card.css("top", endY + "px")
	card.css("left", endX + "px")
	if(position % 2 == 0) {
		card.css("transform", "rotate(180deg)")
	} else {
		card.css("transform", "rotate(270deg)")
	}

}

function getOffsetPosition(playerNumber) {
	//Assume that I sit at seat 0, and seats increment clockwise.
	console.log("getting offset (" + offset + ") for player " + playerNumber)
	return (playerNumber + offset) % 4
}

function playCard(card) {
	var id = card.attr('id')
	$.ajax({
		method: "POST",
		url: "http://localhost:5000/game/play",
		data: {
			"player": parseInt(pnum),
			"card": parseInt(id)
		},
		success: function(res) {
			animateIn(card, pnum)
			trickCards += 1
		}
	});
}

function conditionalPlay() {
	if(myTurn){
		playCard($(this))
	}
}

function addCard(cardId) {
	var card = $('<div class="card" id="' + cardId + '"></div>"')
	var link = "url(src/img/cards/" + ntoc(cardId) + ".png)"
	card.css("background-image", link)
	card.click(conditionalPlay)
	$(".card_container").append(card)
}

function addCardListener(){
	$(".card").hover(function() {
		if(myTurn) {
			$(this).css("transform", "translateY(-" + ch * 0.4 + "px)")
		}
	}, function() {
		if(myTurn) {
			$(this).css("transform", "translateY(0px)")
		}
	})
}

function showHand(response) {
		response.forEach(function(card) {
			addCard(card.num)
		})

		layoutCards()
}

function layoutCards() {
	var width = $(".card_container").width() * 0.9
	var padding = $(".card_container").width() * 0.1

	ch = $(".card_container").height() * 0.2
	cw = ch / 1.523 // Card size ratio

	$(".card").css("width", cw + "px")
	$(".card").css("height", ch + "px")

	var cards = $(".card")
	var numCards = cards.length
	var spacePerCard = width / numCards
	cards.each(function(index) {
		//Don't want to mess with cards that have been moved because of animated playing
		if(!$(this).hasClass("played")) {
			var offset = (spacePerCard * index) + (padding / 2);
			$(this).css("left", offset + "px")
		}
	})
	if(!myTurn) {
		cards.css("filter", "grayscale(60%)")
	} else {
		cards.css("filter", "grayscale(0%)")
	}

	addCardListener()
}

function update(local = false) {
	if(!local) {
		$.ajax({
			method: "POST",
			url: "http://localhost:5000/game/player/hand",
			data: {
				"pid" : player
			},
			success: function(response) {
				showHand(response)
			}
		})
	} else {
		layoutCards()
	}
}

socket.on('play-card', (msg) => {
	var card = msg.card
	var player = msg.player
	if(!myTurn && msg != undefined) {
		trickCards += 1
		addCard(card)
		animateIn($("#" + card), player)
		console.log("Card " + card + " played by P" + player)
	} else {
		console.log("Cannot recieve played card -- my turn, or bad card.")
	}
})

socket.on('update', (msg) => {
	update()
})

socket.on('turn', (msg) => {
	console.log("TURN: " + msg)
	if(msg == pnum) {
		myTurn = true
		$(".turn").css("display", "block")
	} else {
		myTurn = false
		$(".turn").css("display", "none")
	}
	update(true)
})

function updateState(gameState) {
	var mode = gameState.mode
	if(mode == "pregame") {

	} else if(mode == "ingame") {

	} else if(mode == "postgame") {

	}
}

function ntoc(n) {
	var suit = Math.floor(n/13)
	var value = n % 13
	return valueNames[value] + suitNames[suit]
}


$(".submit").click(function() {
	var pid = $("#pid_input").val()
	player = pid
	$.ajax({
		type: "POST",
		url: "http://localhost:5000/game/player",
		data: {
			"pid": pid
		},
		success: function (response) {
			if(!response.valid) {
				$(".entry_form_response").text("Game already full!");
			} else {
				player = response.pid;
				pnum = response.pnum;
				offset = 4 - pnum; //seat offset for visualization
				$(".pid").text(player + "(" + pnum + ")")
				$("#pid_text").fadeToggle();
				$(".entry_form").fadeToggle()
				$(".card_container").fadeToggle()
			}
		}

	})
})

$(window).resize(function() {
	layoutCards()
})


$(document).ready(function() {
	$.ajax({
		url: "http://localhost:5000/game/status"
	}).done(function(response) {
		updateState(response)
	})
})
