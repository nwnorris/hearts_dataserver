var socket = io();

var player = "";

function showHand(response) {
		console.log(response)
}

socket.on('update', (msg) => {
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
})

function updateState(gameState) {
	var mode = gameState.mode
	if(mode == "pregame") {

	} else if(mode == "ingame") {

	} else if(mode == "postgame") {

	}
}

function init() {
	$(".submit").click(function() {
		var pid = $("#pid_input").val()
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
					$(".pid").text(player)
					$("#pid_text").fadeToggle();
					$(".entry_form").fadeToggle()
				}
			}

		})
	})
}


$(document).ready(function() {
	init()
	$.ajax({
		url: "http://localhost:5000/game/status"
	}).done(function(response) {
		updateState(response)
	})
})
