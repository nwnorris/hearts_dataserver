var socket = io();
socket.emit('player-connect', 'Bobby')

socket.on('game-message', (msg) => {
	console.log(msg)
	var log = document.getElementsByClassName("game_log")[0];
	var p = document.createElement("P")
	var text = document.createTextNode(msg)
	p.append(text)
	log.appendChild(p)
})

function updateState(gameState) {
	var mode = gameState.mode
	if(mode == "pregame") {

	} else if(mode == "ingame") {

	} else if(mode == "postgame") {

	}
}

$(document).ready(function() {
	$.ajax({
		url: "http://localhost:5000/game/status"
	}).done(function(response) {
		updateState(response)
	})
})

$(".submit").click(function() {
	console.log("heyo")
	var pid = $(this).text()
	console.log(pid)
})
