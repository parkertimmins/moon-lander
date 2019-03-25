

function toRad(degree) {
    return degree * Math.PI / 180
}

function combine_acceleration(previous, current) {
    return previous.map((c, i) => (c + current[i]) / 2);
}

// not just for a and v, can be v and x
function scale_add(d_t, a, old_v) {
    const d_v = a.map(c => c * d_t);
    return old_v.map((c, i) => c + d_v[i]);
}

// change in time, acceleration, and angular acceleration
function get_next_state(d_t, state, d_a, d_a_a) {
  
    // assume that change in acceleration applies to all of d_t
    const acceleration = combine_acceleration(state.acceleration, d_a);
    const velocity = scale_add(d_t, acceleration, state.velocity);
    const distance = scale_add(d_t, velocity, state.distance);

    const angular_acceleration = combine_acceleration(state.angular_acceleration, d_a_a);
    const angular_velocity = scale_add(d_t, angular_acceleration, state.angular_velocity);
    const orientation = scale_add(d_t, angular_velocity, state.orientation);

    return {
        distance,
        velocity,
        acceleration,
        orientation,
        angular_velocity,
        angular_acceleration
    }
}

function clear_canvas() {
    const canvas = document.getElementById("canvas-refreshing");
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function draw_square(right, down, square_size, color) {
    const canvas = document.getElementById("canvas-refreshing");
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(right, down, square_size, square_size);
    ctx.stroke();
    ctx.closePath();
}

function draw_image_lander(state) {
   // const img = new Image(); 
    //img.src = 'lander.svg';
    //
    const img = document.getElementById("lander");

    const canvas = document.getElementById("canvas-refreshing");
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.translate(state.distance[0], state.distance[1]);
   
    // svg is offset for 0 orientation by PI/2 
    ctx.rotate(-state.orientation[0] + Math.PI/2);

    // x, y
    ctx.drawImage(img, -img.width/2, -img.height/2);
    ctx.restore();
}


function draw_fire(state) {
    const fire = new Image(); 
    fire .src = 'fire.svg';

    const lander = document.getElementById("lander");

    const canvas = document.getElementById("canvas-refreshing");
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.translate(state.distance[0], state.distance[1]);
   
    // svg is offset for 0 orientation by PI/2 
    ctx.rotate(-state.orientation[0] + Math.PI/2);

    ctx.drawImage(fire, -fire.width/2, + lander.height/3 - fire.height/2);
    ctx.restore();
}



function draw_state(state) {
    const width = 20;
    const height = 80;

    const canvas = document.getElementById("canvas-refreshing");
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.translate(state.distance[0], state.distance[1]);
    
    ctx.rotate(-state.orientation[0]);
    
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.fillRect(-height/2, -width/2, height, width);
    ctx.closePath();
    ctx.restore();
}



let up_pressed = false;
let left_pressed = false;
let right_pressed = false;

let startTime = null;
let last_timestamp = null;

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
    angular_acceleration: [0]
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

    clear_canvas();
   
    const d_t_seconds = (timestamp - last_timestamp) / 1000;

    const d_a_engine = up_pressed ? [Math.cos(state.orientation) * main_engine_accel, -Math.sin(state.orientation) * main_engine_accel] : [0, 0]
    const d_a = d_a_engine.map((c, i) => c + d_a_gravity[i]);

    let d_a_a;
    if (left_pressed && !right_pressed) {
        d_a_a = [orientation_jet_acceleration];
    } else if (right_pressed && !left_pressed) {
        d_a_a = [-orientation_jet_acceleration];
    } else {
        d_a_a = [0];
    }
    
    state = get_next_state(d_t_seconds, state, d_a, d_a_a);
  
    if (up_pressed) {
        draw_fire(state);
    } 
    draw_image_lander(state); 
    //draw_state(state);

    last_timestamp = timestamp;
    window.requestAnimationFrame(step);
}

const LEFT_ARROW = 37
const UP_ARROW = 38
const RIGHT_ARROW = 39
const W = 87
const A = 65
const D = 68
window.onload = function () {
	window.addEventListener("keydown", event => {
		if (event.keyCode === LEFT_ARROW || event.keyCode === A) {
			left_pressed = true;
		} else if (event.keyCode === RIGHT_ARROW || event.keyCode === D) {
			right_pressed = true;
		} else if (event.keyCode === UP_ARROW || event.keyCode === W) {
			up_pressed = true;
		}
	});
	
	window.addEventListener("keyup", event => {
		if (event.keyCode === LEFT_ARROW || event.keyCode === A) {
			left_pressed = false;
		} else if (event.keyCode === RIGHT_ARROW || event.keyCode === D) {
			right_pressed = false;
		} else if (event.keyCode === UP_ARROW || event.keyCode === W) {
			up_pressed = false;
		}
	});

	resizeCanvasToDisplaySize();
    
    window.requestAnimationFrame(step);
}

function resizeCanvasToDisplaySize() {
	const canvas = document.getElementById("canvas-refreshing");
   const width = canvas.clientWidth;
   const height = canvas.clientHeight;

   // If it's resolution does not match change it
   if (canvas.width !== width || canvas.height !== height) {
     canvas.width = width;
     canvas.height = height;
   }
}



