const TIMESTEP = 17; // 60 frames per second

var svg = document.getElementById('board'),
svgNS = "http://www.w3.org/2000/svg",
intervalId = 0, delta = 0;

var svgBBox;
function setViewport() {
	svg.setAttribute("width", window.innerWidth);
	svg.setAttribute("height", window.innerHeight);
	svgBBox = svg.getBoundingClientRect();
	drawCircle();
};
setViewport();
window.addEventListener('resize', setViewport, false);

function makeBall(_cx, _cy, _r, _color, _vx, _vy) {
	var cx = _cx, cy = _cy, r = _r, color = _color, vx = _vx, vy = _vy;
	var newBall = document.createElementNS(svgNS, "circle");
	newCircle.setAttributeNS(null, "cx", cx);
	newCircle.setAttributeNS(null, "cy", cy);
	newCircle.setAttributeNS(null, "r", r);
	newCircle.setAttributeNS(null, "fill", color);
	svg.appendChild(newCircle);
	var getPos = function() {
		return {x: cx, y: cy};
	}
	var getVel = function() {
		return {x: vx, y: vy};
	}
	var move = function() {
		if (cx < 0 || cx > svgBBox.width) {
			vx *= -1;
		}
		if (cy < 0 || cy > svgBBox.height) {
			vy *= -1;
		}
		// Todo: collisions...
		cx += vx * TIMESTEP / 1000.;
		cy += vy * TIMESTEP / 1000.;
	}
	return {
		pos: getPos,
		vel: getVel,
		move: move
	}
}

var clear = document.getElementById('clear');
clear.addEventListener('click', function() {
	delta = 0;
	while (svg.firstChild) {
		svg.removeChild(svg.firstChild);
	}
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = 0;
	}
});

function animate() {
	delta = window.performance.now() - animationStartTime;
}

var start = document.getElementById('start');
start.addEventListener('click', function() {
	animationStartTime = window.performance.now() - delta;
	if (intervalId) {
		clearInterval(intervalId);
	}
	intervalId = setInterval(animate, TIMESTEP);
});

var stop = document.getElementById('stop');
stop.addEventListener('click', function() {
	if (intervalId) {
		clearInterval(intervalId);
	}
	intervalId = 0;
});
