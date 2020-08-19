var socket = io();

socket.on('game-message', (msg) => {
	var log = document.getElementsByClassName("game_log")[0];
	var p = document.createElement("P")
	var text = document.createTextNode(msg)
	p.append(text)
	log.appendChild(p)
})
