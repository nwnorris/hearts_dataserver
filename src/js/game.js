var socket = io();

var player = "";
var pnum = -1;
var session = undefined;
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
	setTimeout(function() {
		card.remove()
	}, 250)
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
	if($(this).hasClass("enabled") && myTurn){
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

function updateCards() {
	$(".card").removeClass("enabled")
	if(myTurn) {
		$.ajax({
			method: "POST",
			url: "http://localhost:5000/game/player/playable",
			data: {
				"pid" : pnum
			},
			success: function(data) {
				for(var i = 0; i < data.length; i++) {
					var id = data[i].num
					$("#" + id).addClass("enabled")
				}
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
				"pid" : player,
				"session" : session
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

function updateTurn(pid) {
	if(pid == pnum) {
		myTurn = true
		$(".turn").css("display", "block")
	} else {
		myTurn = false
		$(".turn").css("display", "none")
	}
	updateCards()
}

// -- SOCKET -- //
socket.on('update', (msg) => {
	update()
})

socket.on('turn', (msg) => {
	var player = msg.pid
	var leadSuit = (msg.leadSuit == undefined) ? -1 : msg.leadSuit
	console.log("TURN: " + player + " (I am " + pnum + "), lead: " + leadSuit)
	updateTurn(player)
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
		$("#pid_text").fadeOut();
		$(".entry_form").fadeIn()
		$(".card_container").fadeOut()
		$(".score").fadeOut()
	} else if(mode == "ingame") {
		console.log("INGAME")
		$("#pid_text").fadeIn();
		$(".entry_form").fadeOut()
		$(".card_container").fadeIn()

		if(gameState.players) {
			for(var i = 0; i < gameState.players.length; i++) {
				$("#pname_" + i).text(gameState.players[i])
			}
		}
		if(gameState.score) {
			for(var i = 0; i < gameState.score.length; i++) {
				$("#pscore_" + i).text(gameState.score[i])
			}
		}
		if(gameState.turn >= 0 && gameState.turn < 4) {
			updateTurn(gameState.turn)
		}
		$(".score").fadeIn()
	} else if(mode == "postgame") {

	}
}

function ntoc(n) {
	var suit = Math.floor(n/13)
	var value = n % 13
	return valueNames[value] + suitNames[suit]
}

function clearStorage() {
	if(localStorage) {
		localStorage['player'] = undefined
		localStorage['pid'] = undefined
		localStorage['session'] = undefined
	}
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
				player = response.player;
				pnum = response.pid;
				session = response.session;
				if(localStorage) {
					localStorage['player'] = player
					localStorage['pid'] = pnum
					localStorage['session'] = response.session
				}
				$(".pid").text(player + "(" + pnum + ")")
				updateState({mode: "ingame"})
			}
		}

	})
})

function getStatus() {
	$.ajax({
		method: "POST",
		url: "http://localhost:5000/game/status",
		data: {
			"session" : session
		}
	}).done(function(response) {
		updateState(response)
		update()
	}).fail(function(response) {
		clearStorage()
		updateState({mode: "pregame"})
	})
}

$(window).resize(function() {
	layoutCards()
})


$(document).ready(function() {
	if(localStorage) {
		var tempPlayer = localStorage['player']
		var tempPid = localStorage['pid']
		var tempSession = localStorage['session']
		if(tempPlayer != undefined && (tempPid >= 0 && tempPid < 4)) {
			player = tempPlayer
			pnum = tempPid
			session = tempSession
			$(".pid").text(player + "(" + pnum + ")")
		}
	}
	getStatus()
})
