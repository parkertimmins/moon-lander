

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
function get_next_state(d_t, state, d_a, d_a_a, up_pressed) {
  
    // assume that change in acceleration applies to all of d_t
    const acceleration = combine_acceleration(state.acceleration, d_a);
    const velocity = scale_add(d_t, acceleration, state.velocity);
    const distance = scale_add(d_t, velocity, state.distance);

    const angular_acceleration = combine_acceleration(state.angular_acceleration, d_a_a);
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

function clear_canvas() {
    const canvas = document.getElementById("canvas-refreshing");
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}


function wrap_width(width, x) {
    return ((x % width) + width) % width
}

function draw_lander_html(state) {
	let lander = document.querySelector(".lander");
    let screenWidth = document.querySelector("#canvas-wrapper").offsetWidth;

    
    


	// translate
	lander.style.top = (state.distance[1] - lander.offsetHeight / 2) + 'px' // TODO fix center offset
	lander.style.left = (wrap_width(screenWidth, state.distance[0]) - lander.offsetWidth / 2) + 'px'; // TODO fix width offset
	
    // rotate 
    lander.style.transform = `rotate(${-state.orientation[0] + Math.PI/2}rad)`;

    lander.style.display = 'block';



    // x, y
    //ctx.drawImage(img, -img.width/2, -img.height/2);
    //ctx.restore();

}

function draw_image_lander(state) {
    const img = new Image(); 
    img.src = 'lander.svg';

    const canvas = document.getElementById("canvas-refreshing");
    const ctx = canvas.getContext("2d");

    ctx.save();

    ctx.translate(wrap_width(canvas.width, state.distance[0]), state.distance[1]);
   
    // svg is offset for 0 orientation by PI/2 
    ctx.rotate(-state.orientation[0] + Math.PI/2);

    // x, y
    ctx.drawImage(img, -img.width/2, -img.height/2);
    ctx.restore();
}

function draw_fire(state) {
    const fire = new Image(); 
    fire.src = 'fire.svg';
    const lander = new Image();
    lander.src = 'lander.svg';

    const canvas = document.getElementById("canvas-refreshing");
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.translate(wrap_width(canvas.width, state.distance[0]), state.distance[1]);
   
    // svg is offset for 0 orientation by PI/2 
    ctx.rotate(-state.orientation[0] + Math.PI/2);

    ctx.drawImage(fire, -fire.width/2, + lander.height/3 - fire.height/2);
    ctx.restore();
}

function draw_hud(state) {
    
    const canvas = document.getElementById("canvas-refreshing");
    const ctx = canvas.getContext("2d");
   
    const hud_margin = 5; 
    const hud_width = 300;
    const hud_height = 200;
    const hud_location = [canvas.width - hud_width - hud_margin, 0 + hud_margin];

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#095835";
    ctx.beginPath();
    ctx.rect(hud_location[0], hud_location[1], hud_width, hud_height);
    ctx.stroke();
    ctx.closePath();

    // draw orientation arrow 
    const arrow_diameter = (hud_height / 2) * 0.6;
    const arrow_circle_radius = ((hud_height / 2) * 0.7) / 2;
    const arrow_width = arrow_diameter / 8;
    const arrow_center = [hud_location[0] + hud_width / 4, hud_location[1] + 3 * hud_height / 4];
   
    // translate to arrow center;
    ctx.save();
    ctx.translate(arrow_center[0], arrow_center[1]);

    // draw arrow bounding circle
    ctx.lineWidth = 2;
    ctx.strokeStyle = "grey";
    ctx.beginPath();
    ctx.moveTo(arrow_circle_radius, 0);
    ctx.arc(0, 0, arrow_circle_radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();

    ctx.rotate(-state.orientation[0]);
    
    ctx.fillStyle = "#0e0c4f";
    ctx.strokeStyle = "#0e0c4f";
    
    // draw rectangle
    ctx.fillRect(-arrow_diameter/2, -arrow_width/2, (3/4) * arrow_diameter + 1, arrow_width);
    // draw triangle
    ctx.beginPath();
    ctx.moveTo(arrow_diameter/4,  arrow_diameter/4);
    ctx.lineTo(arrow_diameter/2,  0);
    ctx.lineTo(arrow_diameter/4,  -arrow_diameter/4);
    ctx.fill();
    ctx.closePath();
    
    ctx.restore();

    const fuel_bar_width = hud_width * 0.8;
    const fuel_bar_height = hud_height / 6;
    const fuel_bar_offset_x = (hud_width - fuel_bar_width) / 2;
    const fuel_bar_offset_y =  hud_height / 6;
   
    // fuel usage 
    const percentFuelUsed = state.fuel / initial_fuel_time; 
    ctx.fillStyle = "orange";
    ctx.fillRect(hud_location[0] + fuel_bar_offset_x, hud_location[1] + fuel_bar_offset_y, fuel_bar_width * percentFuelUsed, fuel_bar_height);
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = "grey";
    ctx.beginPath();
    ctx.rect(hud_location[0] + fuel_bar_offset_x, hud_location[1] + fuel_bar_offset_y, fuel_bar_width, fuel_bar_height);
    ctx.stroke(); 
    ctx.closePath();
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

    clear_canvas();
   
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
  
    if (accelerating) {
        draw_fire(state);
    } 
    draw_hud(state);
	draw_lander_html(state);

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

