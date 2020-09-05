var socket = io();

var player = "";
var pnum = -1;
var offset = -1;
var suitNames = ["C", "S", "D", "H"]
var valueNames = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
var myTurn = false
var hasSelected = false
var ch = 0
var cw = 0

function animateOut(card, pnum) {
	//Convert absolute player ID to relative player position, then get position coords
	var coords = {x: $(window).width() / 2, y: ch * -1}
	card.css("top", coords.y + "px")
	card.css("left", coords.x + "px")
}

function playCard(card) {
	var id = card.attr('id')
	console.log("Posting my play of card " + id)
	$.ajax({
		method: "POST",
		url: "http://localhost:5000/game/play",
		data: {
			"player": parseInt(pnum),
			"card": parseInt(id)
		},
		success: function(res) {
			animateOut(card, pnum)
		}
	});
}

function conditionalSelect() {
	if(myTurn){
		if($(this).hasClass("selected")){
			playCard($(this))
		} else {
			$(".selected").removeClass("selected")
			$(this).addClass("selected")
		}
	}
}

function addCard(cardId) {
	var card = $('<div class="card" id="' + cardId + '"></div>"')
	var link = "url(src/img/cards/" + ntoc(cardId) + ".png)"
	card.css("background-image", link)
	card.css("width", cw + "px")
	card.css("height", ch + "px")
	card.click(conditionalSelect)
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
		updateCards()
}

function layoutCards() {
	var width = $(".card_container").width() * 0.9
	var padding = $(".card_container").width() * 0.1

	ch = $(".card_container").height() * 0.4
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
}

function updateCards(leadSuit = -1) {
	if(!myTurn) {
		$(".card").removeClass("enabled")
	} else {
		$(".card").addClass("enabled")
	}

	if(leadSuit >= 0) {
		$(".card").each(function() {
			var suit = Math.floor($(this).attr('id') / 13)
			if(suit != leadSuit && !$(this).hasClass("played")) {
				$(this).removeClass("enabled")
			}
		})
	}
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
		updateCards()
	}
}

function collectTrick(trick, pnum) {
	trick.each(function() {
		animateOut($(this), pnum)
	})
	$(".played").fadeOut()
	setTimeout(function(){
		$(".played").remove()
	}, 250)
}

// -- SOCKET -- //
socket.on('update', (msg) => {
	update()
})

socket.on('turn', (msg) => {
	var player = msg.pid
	var leadSuit = (msg.leadSuit == undefined) ? -1 : msg.leadSuit
	console.log("TURN: " + player + " (I am " + pnum + "), lead: " + leadSuit)
	if(player == pnum) {
		myTurn = true
		$(".turn").css("display", "block")
	} else {
		myTurn = false
		$(".turn").css("display", "none")
	}
	updateCards(leadSuit)
})

socket.on('trick-complete', (msg) => {
	var trick = $(".played")
	collectTrick(trick, msg.winner)
})

socket.on('score-update', (msg) => {
	console.log(msg)
	for(var i = 0; i < msg.players.length; i++){
		var p = msg.players[i]
		$("#pname_" + p.id).text(p.name)
		$("#pscore_" + p.id).text(p.score)
	}
})

// -- END SOCKET -- //

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
