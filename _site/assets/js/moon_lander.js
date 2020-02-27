

function toRad(degree) {
    return degree * Math.PI / 180
}

function combine_acceleration(previous, current) {
    //return previous.map((c, i) => ( current[i]));
    return previous.map((c, i) => (c + current[i]) / 2);
}

// not just for a and v, can be v and x
function scale_add(d_t, a, old_v) {
    const d_v = a.map(c => c * d_t);
    return old_v.map((c, i) => c + d_v[i]);
}

// change in time, acceleration, and angular acceleration
// d_a - new change in accel vector
// d_a_a - new angular accel
// d_t - change in time
function get_next_state(d_t, state, d_a, d_a_a, up_pressed) {
  
    // assume that change in acceleration applies to all of d_t
    const acceleration = d_a 
    const velocity = scale_add(d_t, acceleration, state.velocity);
    const distance = scale_add(d_t, velocity, state.distance);

    const angular_acceleration = d_a_a
    const angular_velocity = scale_add(d_t, angular_acceleration, state.angular_velocity);
    const orientation = scale_add(d_t, angular_velocity, state.orientation);
  
    let fuel;
    if (up_pressed) {
        fuel = state.fuel - d_t < 0 ? 0 : state.fuel - d_t;
    } else {
        fuel = state.fuel;
    }

    return {
        distance,
        velocity,
        acceleration,
        orientation,
        angular_velocity,
        angular_acceleration,
        fuel
    }
}

function wrap_width(width, x) {
    return ((x % width) + width) % width
}

function draw_lander(state) {
	let lander = document.querySelector(".lander");
    let screenWidth = document.querySelector("#canvas-wrapper").offsetWidth;

	// translate
	lander.style.top = (state.distance[1] - lander.offsetHeight / 2) + 'px';
	lander.style.left = (wrap_width(screenWidth, state.distance[0]) - lander.offsetWidth / 2) + 'px';
	
    // rotate 
    lander.style.transform = `rotate(${-state.orientation[0] + Math.PI/2}rad)`;

    lander.style.display = 'block';
}

function draw_fire(should_draw_fire, state) {
	document.querySelectorAll(".fire").forEach(fire => {
        fire.style.visibility = should_draw_fire ? 'visible' : 'hidden';
    });
}


function draw_hud(state) {
    const arrow = document.querySelector('.hud .arrow');
    arrow.style.transform = `rotate(${-state.orientation[0] + Math.PI/2}rad)`;
    arrow.style.visibility = 'visible';
  
    const fuel = document.querySelector('.hud .fuel');
    fuel.style.width = `${(state.fuel / initial_fuel_time) * 100}%`;
}


let up_pressed = false;
let left_pressed = false;
let right_pressed = false;
let paused = false;

let startTime = null;
let last_timestamp = null;

const initial_fuel_time = 20; // seconds
const initial_v = [200, 80];
const initial_orient = [Math.PI - Math.tan(initial_v[1]/initial_v[0])];

//const initial_v = [0, 0];
//const initial_orient = [0];

// state vectors 
let state = {
    distance: [100, 100],
    velocity: initial_v,
    //velocity: [0, 0],
    acceleration: [0, 0],
    orientation: initial_orient, 
    angular_velocity: [0],
    angular_acceleration: [0],

    fuel: initial_fuel_time 
}

const main_engine_accel = 150; // meter per second ? 
const orientation_jet_acceleration = Math.PI / 2; // PI/8 per second
//const d_a_gravity = [0, 0]; // positive downward
const d_a_gravity = [0, 40]; // positive downward

const pixel_per_meter = 4;

function step(timestamp) {

    if (!startTime) {
        startTime = timestamp;
        last_timestamp = timestamp;
    }

    const d_t_seconds = (timestamp - last_timestamp) / 1000;

    const accelerating = up_pressed && state.fuel > 0;
    const d_a_engine = accelerating ? [Math.cos(state.orientation) * main_engine_accel, -Math.sin(state.orientation) * main_engine_accel] : [0, 0]
    const d_a = d_a_engine.map((c, i) => c + d_a_gravity[i]);

    let d_a_a;
    if (left_pressed && !right_pressed) {
        d_a_a = [orientation_jet_acceleration];
    } else if (right_pressed && !left_pressed) {
        d_a_a = [-orientation_jet_acceleration];
    } else {
        d_a_a = [0];
    }
  
    if (!paused) { 
        state = get_next_state(d_t_seconds, state, d_a, d_a_a, up_pressed);
    }
  
    draw_hud(state);
	draw_lander(state);
    draw_fire(accelerating, state);
    
    last_timestamp = timestamp;
    window.requestAnimationFrame(step);
}

const LEFT_ARROW = 37
const UP_ARROW = 38
const RIGHT_ARROW = 39
const SPACE_BAR = 32;
window.onload = function () {
	window.addEventListener("keydown", event => {
		if (event.keyCode === LEFT_ARROW) {
			left_pressed = true;
		} else if (event.keyCode === RIGHT_ARROW) {
			right_pressed = true;
		} else if (event.keyCode === UP_ARROW) {
			up_pressed = true;
		}
	});
	
	window.addEventListener("keyup", event => {
		if (event.keyCode === LEFT_ARROW) {
			left_pressed = false;
		} else if (event.keyCode === RIGHT_ARROW) {
			right_pressed = false;
		} else if (event.keyCode === UP_ARROW) {
			up_pressed = false;
		} else if (event.keyCode === SPACE_BAR) {
            paused = !paused;
        } 
    });

    window.requestAnimationFrame(step);
}

