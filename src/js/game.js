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


socket.emit('play-card', JSON.parse('{"id" : 4, "card" : 5}'))