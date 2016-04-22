// 1000 ms / 60 frames = 17 ms per frame
const TIMESTEP = 17;

// minimum and maximum percentage of the svg's width that a ball's radius can be
const MIN_RAD = 0.005, MAX_RAD = 0.05;

// minimum and maximum possible velocity of a newly-created ball, expressed as
// a percentage of the svg's width per TIMESTEP for a ball of radius MAX_RAD
// (velocity increases quadratically as radius gets smaller than MAX_RAD)
const MIN_VEL = -0.03, MAX_VEL = 0.03;

// array that stores all balls currently on the screen
var balls = [];

////////////////////////////////////////////////////////////////////////////////

var svg = document.getElementById('board'), svgBBox;

function setViewport() {
	svg.setAttribute('width', window.innerWidth);
	svg.setAttribute('height', window.innerHeight);
	svgBBox = svg.getBoundingClientRect();
	animate();
};

setViewport();

window.addEventListener('resize', setViewport, false);

////////////////////////////////////////////////////////////////////////////////
var pointGrabbed = svg.createSVGPoint(), pointDraggedTo = svg.createSVGPoint(),
curBall = null;

function moveBall() {
	pointDraggedTo =
	pointDraggedTo.matrixTransform(svg.getScreenCTM().inverse());
	curBall.drag(
		pointDraggedTo.x - pointGrabbed.x,
		pointDraggedTo.y - pointGrabbed.y
		);
	pointGrabbed.x = pointDraggedTo.x;
	pointGrabbed.y = pointDraggedTo.y;
}

function dragBallMouse(evt) {
	pointDraggedTo.x = evt.clientX;
	pointDraggedTo.y = evt.clientY;
	moveBall();
}

function dragBallTouch(evt) {
	pointDraggedTo.x = evt.touches[0].clientX;
	pointDraggedTo.y = evt.touches[0].clientY;
	moveBall();
}

function dropBall(evt) {
	document.onmousemove = null;
	document.onmouseup = null;
	curBall = null;
}

function makeBall(_cx, _cy, _r, _color, _vx, _vy) {
	var r = _r, pos = {x: _cx, y: _cy}, vel = {x: _vx, y: _vy},
	ballCollisions = [];

	var getPos = function() {
		return pos;
	}

	var getRad = function() {
		return r;
	}

	var getVel = function() {
		return vel;
	}

	var addCollision = function(otherId) {
		ballCollisions.push(otherId);
	}

	var collideBalls = function() {
		var i, otherPos, deltaX, deltaY, deltaMag, mass, otherMass, totalMass,
		otherRad, adjustmentFactor, otherVel, compI, compF, otherCompI,
		otherCompF;

		for (i =  0; i < ballCollisions.length; i++) {
			// get vector from center of this ball to center of other ball
			otherPos = balls[ballCollisions[i]].getPos();
			deltaX = pos.x - otherPos.x;
			deltaY = pos.y - otherPos.y;
			deltaMag = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			// avoid division by 0 just in case
			if (deltaMag == 0) {
				deltaX = 1;
				deltaMag = 1;
			}

			// normalize the delta vector
			deltaX /= deltaMag;
			deltaY /= deltaMag;

			// the 'mass' of a ball is just its radius squared
			otherRad = balls[ballCollisions[i]].getRad();
			mass = r * r;
			otherMass = otherRad;
			otherMass *= otherMass;
			totalMass = mass + otherMass;

			// move the balls so that they are tangent
			adjustmentFactor = (otherRad + r - deltaMag) / totalMass;
			pos.x += adjustmentFactor * otherMass * deltaX;
			pos.y += adjustmentFactor * otherMass * deltaY;
			otherPos.x -= adjustmentFactor * mass * deltaX;
			otherPos.y -= adjustmentFactor * mass * deltaY;

			// get each ball's velocity component parallel to the normalized
			// delta vector
			compI = vel.x * deltaX + vel.y * deltaY;
			otherVel = balls[ballCollisions[i]].getVel();
			otherCompI = otherVel.x * deltaX + otherVel.y * deltaY;

			// calculate resultant parallel velocity components, assuming a
			// perfectly elastic collision
			compF = (compI * (mass - otherMass) + 2 * otherMass * otherCompI) /
			(mass + otherMass);
			otherCompF = (otherCompI * (otherMass - mass) + 2 * mass * compI) /
			(mass + otherMass);

			// replace the initial parallel velocity components with the final
			// ones
			vel.x += (compF - compI) * deltaX;
			vel.y += (compF - compI) * deltaY;
			otherVel.x += (otherCompF - otherCompI) * deltaX;
			otherVel.y += (otherCompF - otherCompI) * deltaY;
		}

		ballCollisions = [];
	}

	var collideEdges = function() {
		if (pos.x < r) {
			vel.x *= -1;
			pos.x = r;
		}
		else if (pos.x > svgBBox.width - r) {
			vel.x *= -1;
			pos.x = svgBBox.width - r;
		}
		if (pos.y < r) {
			vel.y *= -1;
			pos.y = r;
		}
		else if (pos.y > svgBBox.height - r) {
			vel.y *= -1;
			pos.y = svgBBox.height - r;
		}
	}

	var move = function() {
		if (this != curBall) {
			pos.x += vel.x * TIMESTEP / 1000.;
			pos.y += vel.y * TIMESTEP / 1000.;

			ball.setAttributeNS(null, 'cx', pos.x);
			ball.setAttributeNS(null, 'cy', pos.y);
		}
	}

	var drag = function(dx, dy) {
		pos.x += dx;
		pos.y += dy;

		vel.x = dx / TIMESTEP * 1000.;
		vel.y = dy / TIMESTEP * 1000.;

		ball.setAttributeNS(null, 'cx', pos.x);
		ball.setAttributeNS(null, 'cy', pos.y);
	}

	var returnVal = {
		getPos: getPos,
		getRad: getRad,
		getVel: getVel,
		addCollision: addCollision,
		collideBalls: collideBalls,
		collideEdges: collideEdges,
		move: move,
		drag: drag
	};

	var ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	ball.setAttributeNS(null, 'cx', _cx);
	ball.setAttributeNS(null, 'cy', _cy);
	ball.setAttributeNS(null, 'r', _r);
	ball.setAttributeNS(null, 'fill', _color);
	svg.appendChild(ball);

	ball.addEventListener('mousedown', function(evt) {
		pointGrabbed.x = evt.clientX;
		pointGrabbed.y = evt.clientY;
		pointGrabbed =
		pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());
		curBall = returnVal;
		dragBallMouse(evt);
		document.onmousemove = dragBallMouse;
		document.onmouseup = dropBall;
	});

	ball.addEventListener('touchstart', function(evt) {
		pointGrabbed.x = evt.touches[0].clientX;
		pointGrabbed.y = evt.touches[0].clientY;
		pointGrabbed =
		pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());
		curBall = returnVal;
		dragBallTouch(evt);
		document.ontouchmove = dragBallTouch;
		document.ontouchend = dropBall;
	});

	return returnVal;
}

// could be made more efficient with a quadtree, but whatevs...
function detectCollisions() {
	var i, j, posI, posJ, deltaX, deltaY, sumRad;

	for (i = 0; i < balls.length - 1; i++) {
		for (j = i + 1; j < balls.length; j++) {
			posI = balls[i].getPos();
			posJ = balls[j].getPos();
			deltaX = posI.x - posJ.x;
			deltaY = posI.y - posJ.y;
			sumRad = balls[i].getRad() + balls[j].getRad();

			if (deltaX * deltaX + deltaY * deltaY < sumRad * sumRad) {
				balls[i].addCollision(j);
			}
		}
	}
}

function animate() {
	detectCollisions();

	var i;
	for (i = 0; i < balls.length; i++) {
		balls[i].collideBalls();
	}
	for (i = 0; i < balls.length; i++) {
		balls[i].collideEdges();
	}
	for (i = 0; i < balls.length; i++) {
		balls[i].move();
	}
}

////////////////////////////////////////////////////////////////////////////////

var intervalId = 0;

// returns a random real number between min and max
function randReal(min, max) {
	return (Math.random() * (max - min)) + min;
}

// returns a random integer between min and max
function randInt(min, max) {
	return Math.floor((Math.random() * (max - min + 1)) + min);
}

function randBall() {
	var radius = randReal(MIN_RAD, MAX_RAD);
	var velFactor = radius / MAX_RAD;
	radius *= svgBBox.width;
	velFactor *= velFactor;
	balls.push(makeBall(
		randReal(radius, svgBBox.width - radius),
		randReal(radius, svgBBox.height - radius),
		radius,
		'#' + randInt(0, 0xffffff).toString(16),
		randReal(MIN_VEL, MAX_VEL) * svgBBox.width / velFactor,
		randReal(MIN_VEL, MAX_VEL) * svgBBox.width / velFactor
		));
	// Ball radius and ball velocity will be proportional to the svg's width.
	// Ball velocity will tend to be inversely proportional to the square of its
	// radius.
}

document.getElementById('start').addEventListener('click', function() {
	if (!intervalId) {
		if (!svg.hasChildNodes()) {
			var numBalls = randInt(10, 15);
			while (numBalls--) {
				randBall();
			}
		}
		intervalId = setInterval(animate, TIMESTEP);
	}
});

document.getElementById('stop').addEventListener('click', function() {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = 0;
	}
});

document.getElementById('clear').addEventListener('click', function() {
	if (svg.hasChildNodes()) {
		while (svg.firstChild) {
			svg.removeChild(svg.firstChild);
		}
		balls = [];
	}
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = 0;
	}
});

document.getElementById('add').addEventListener('click', function() {
	randBall();
});

document.getElementById('remove').addEventListener('click', function() {
	if (svg.hasChildNodes()) {
		svg.removeChild(svg.lastChild);
		balls.pop();
		if (!svg.hasChildNodes()) {
			clearInterval(intervalId);
			intervalId = 0;
		}
	}
});
