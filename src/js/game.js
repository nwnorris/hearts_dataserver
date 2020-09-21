var socket = io();

var player = "";
var pnum = -1;
var session = undefined;
var offset = -1;
var suitNames = ["C", "S", "D", "H"]
var valueNames = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
var playerNames = []
var cardsToPass = []
var myTurn = false
var passTarget = -1
var hasSelected = false
var currentMode = undefined;
var ch = 0
var cw = 0
var debugAI = true

var SERVER_URL = "http://hearts.nnorris.com"
//var SERVER_URL = "http://localhost:5000"

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
		url: SERVER_URL + "/game/play",
		data: {
			"player": parseInt(pnum),
			"card": parseInt(id)
		},
		success: function(res) {
			animateOut(card, pnum)
			layoutCards()
		}
	});
}

function animateToPassPosition(card, pos) {
	var holder = $("#pc" + pos)
	holder.append(card)
	card.removeClass("selected")
	card.addClass("pass_card_selection")
	card.css("width", "")
	card.css("height", "")
	card.css("left", "")
	card.css("transform", "rotate(180deg)")
}

function addToPass(card) {
	console.log(card)
	cardsToPass.push(card)
	animateToPassPosition(card, cardsToPass.length)
	if(cardsToPass.length == 3) {
		$(".pass_submit").removeClass("button_disabled")
		$(".pass_submit").addClass("button_enabled")
		$(".pass_submit").addClass("green")
	}
}

function removePassedCards() {
	$(".pass_card_selection").fadeOut()
	setTimeout(function() {
		$(".pass_card_selection").remove()
	}, 1000)
}

$(".pass_submit").click(function() {
	if(cardsToPass.length == 3) {
		var cards = []
		for(var i = 0; i < cardsToPass.length; i++) {
			cards.push(cardsToPass[i].attr('id'))
		}
		$(this).removeClass("green")
		$(this).removeClass("button_enabled")
		$(this).addClass("button_disabled")
		$(".pass_card_selection").removeClass("enabled")
		$.ajax({
			method: 'POST',
			url: SERVER_URL + "/game/player/pass",
			data: {
				pid: pnum,
				target: passTarget,
				cards: cards
			},
			success: removePassedCards
		})
	}
})

$(".pass_reset").click(function() {
	cardsToPass = []
	$(".pass_submit").removeClass("green")
	$(".pass_submit").removeClass("button_enabled")
	$(".pass_submit").addClass("button_disabled")

	$(".pass_card_selection").each(function() {
		$(".card_container").append($(this))
		$(this).removeClass("pass_card_selection")
	})
	layoutCards()
})

function conditionalSelect() {
	if(currentMode == 'ingame') {
		//Play card within a round
		if($(this).hasClass("enabled") && myTurn){
			if($(this).hasClass("selected")){
				playCard($(this))
			} else {
				$(".selected").removeClass("selected")
				$(this).addClass("selected")
			}
		}
	} else if (currentMode == 'pass' && cardsToPass.length < 3 && !$(this).hasClass("pass_card_selection")) {
		//Select card to pass
		if($(this).hasClass("selected")) {
			addToPass($(this))
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

function showHand(response) {
		$(".card").remove()
		response.forEach(function(card) {
			addCard(card.num)
		})

		layoutCards()
		updateCards()
}

function layoutCards() {
	var width = $(".card_container").width() * 0.9
	var padding = $(".card_container").width() * 0.1

	ch = $(".card_container").height() * 0.5
	cw = ch / 1.523 // Card size ratio

	$(".card").css("width", cw + "px")
	$(".card").css("height", ch + "px")

	//Size pass card holders
	var passHeight = $(".pass_container_body").height()
	if(ch > passHeight) {
		var ratio = (ch - passHeight) / ch
		var tempch = (1 - ratio) * ch
		var tempcw = (1 - ratio) * cw
		$(".pass_card").css("width", tempcw + "px")
		$(".pass_card").css("height", tempch + "px")
	} else {
		$(".pass_card").css("width", cw + "px")
		$(".pass_card").css("height", ch + "px")
	}

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
	if(myTurn || currentMode == 'pass') {
		$.ajax({
			method: "POST",
			url: SERVER_URL + "/game/player/playable",
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

	if(myTurn && debugAI) {
		var choice = $(".enabled")[0]
		playCard(choice)
	}
}

function update(local = false) {
	if(!local) {
		$.ajax({
			method: "POST",
			url: SERVER_URL + "/game/player/hand",
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
	if(pid == pnum && currentMode == 'ingame') {
		myTurn = true
		$(".turn").css("color", "red")
	} else {
		myTurn = false
		$(".turn").css("color", "white")
	}
	updateCards()
}

// -- SOCKET -- //
socket.on('update', (msg) => {
	update()
	getStatus()
})

socket.on('turn', (msg) => {
	var player = msg.pid
	var leadSuit = (msg.leadSuit == undefined) ? -1 : msg.leadSuit
	updateTurn(player)
})

socket.on('trick-complete', (msg) => {
	var trick = $(".played")
	collectTrick(trick, msg.winner)
})

socket.on('score-update', (msg) => {
	console.log(msg)
	playerNames = []
	for(var i = 0; i < msg.players.length; i++){
		var p = msg.players[i]
		playerNames.push(p.name)
		$("#pname_" + p.id).text(p.name)
		$("#pscore_" + p.id).text(p.score)
	}
	layoutCards()
})

socket.on('get-pass', (msg) => {
	update()
	passTarget = msg.targets[pnum]
	cardsToPass = []
	$(".pass_header").find("p").text("You are passing to: " + playerNames[passTarget])
	updateState({mode: 'pass'})
	layoutCards()
})

socket.on('moon', (msg) => {
	if(msg.pid == pnum) {
		updateState({mode: 'moon'})
	}
})

socket.on('game-end', (msg) => {
	console.log(msg)
	//Scores should already be sorted
	msg.score.forEach(function(info, index) {
		$("#name_p" + index).text(playerNames[info[0]])
		$("#score_p" + index).text(info[1])
	})

	updateState({mode : 'endgame'})
})

// -- END SOCKET -- //

function pass(gameState) {
	console.log("Mode: pass")
	$(".entry_form").fadeOut()
	$(".moon_container").fadeOut()
	$(".pass_container").fadeIn()
	$(".pass_container").css("display", "flex")
	$(".card_container").fadeIn()
	$("#pid_text").fadeIn();
	$(".card").addClass("enabled")
	if(passTarget == -1) {
		$.ajax({
			method : 'POST',
			url : SERVER_URL + "/game/player/pass/target",
			data : {
				pid: pnum
			},
			success: function(data) {
				passTarget = data.target
				$(".pass_header").find("p").text("You are passing to: " + playerNames[passTarget])
			}
		})
	}
}

function pregame(gameState) {
	console.log("Mode: pregame")
	$("#pid_text").fadeOut();
	$(".entry_form").fadeIn()
	$(".card_container").fadeOut()
	$(".score").fadeOut()
	$(".pass_container").fadeOut()
	$(".moon_container").fadeOut()
	$(".turn").css("display", "none")
}

function ingame(gameState) {
	console.log("Mode: ingame")
	$(".turn").fadeIn()
	$(".pass_container").fadeOut()
	$("#pid_text").fadeIn();
	$(".entry_form").fadeOut()
	$(".card_container").fadeIn()
	$(".moon_container").fadeOut()
	if(gameState.turn >= 0 && gameState.turn < 4) {
		updateTurn(gameState.turn)
	}
	$(".score").fadeIn()
}

function moon(gameState) {
	console.log("Mode: moon")
	$(".turn").fadeOut()
	$(".card_container").fadeOut()
	$(".pass_container").fadeOut()
	$(".moon_container").fadeIn()
}

function endGame(gameState) {
	console.log("Mode: endgame")
	$("#pid_text").fadeOut();
	$(".card_container").fadeOut()
	$(".score").fadeOut()
	$(".pass_container").fadeOut()
	$(".moon_container").fadeOut()
	$(".turn").css("display", "none")
	$(".endgame").fadeIn()
}

function updateState(gameState) {
	currentMode = gameState.mode
	if(gameState.players) {
		playerNames = []
		for(var i = 0; i < gameState.players.length; i++) {
			$("#pname_" + i).text(gameState.players[i])
			playerNames.push(gameState.players[i])
		}
	}
	if(gameState.score) {
		for(var i = 0; i < gameState.score.length; i++) {
			$("#pscore_" + i).text(gameState.score[i])
		}
	}
	if(currentMode == "pregame") {
		pregame(gameState)
	} else if (currentMode == "pass") {
		pass(gameState)
	} else if(currentMode == "ingame") {
		ingame(gameState)
	} else if(currentMode == "moon") {
		moon(gameState)
	} else if(currentMode == "endgame") {
		endGame(gameState)
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
		url: SERVER_URL + "/game/player",
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

$(".moon_option").click(function() {
	var choice = $(this).attr('id')
	if(choice == "add" || choice == "subtract") {
		$.ajax({
			method: 'POST',
			url: SERVER_URL + "/game/player/moon",
			data: {
				pid: pnum,
				moonChoice: choice
			},
			success: function() {
				updateState({mode: 'ingame'})
			}
		})
	}
})

function getStatus() {
	$.ajax({
		method: "POST",
		url: SERVER_URL + "/game/status",
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
	SERVER_URL = "http://" + $(".host").text()
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
