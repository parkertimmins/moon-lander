


// Start state


/*
 * Every object has a 
 * - mass
 * - location
 * - speed vector
 *
 * at every time step
 *
 * compute force exerted on every object by every other object
 * use force/mass to calculate acceleration
 * update speed, distance vector
 *
 */


const G = 100 // yes, we can define fundamental constants!

function euclidean_distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1] , 2))
}

function gravity_force(mass1, mass2, distance) {
    return (G * mass1 * mass2) / (distance * distance)
}

planets = [
	{
		name: 'planet1',
        mass: 8000, // Mg
		radius: 15
    },
	

    {
		name: 'planet2',
        mass: 100, // Mg
		radius: 5 
    },

	{
		name: 'planet3',
        mass: 50000, // Mg
		radius: 20
    },
/*
	{
		name: 'planet4',
        mass: 100, // Mg
		radius: 5
    }
*/
]

states = {
    planet1: {
        location: [300, 1000], // top px, left px
        velocity: [60, 0], 
		acceleration: null
    },
    
	planet2: {
        location: [300, 800], // px, px
        velocity: [0,  50], 
		acceleration: null
    },
    planet3: {
        location: [1100, 1300], // px, px
        velocity: [-80, 30], 
    },
/*
    planet4: {
        location: [500, 1100], // px, px
        velocity: [-320, 0], 
    }

*/

}

function compute_acceleration_per_planet(planets, states) {
	const per_planet_accel = []
	for (let p1 of planets) {
		const accels_on_p1 = []		
		for (let p2 of planets) {

			// skip self force	
			if (p1.name != p2.name) {
				const p1_location = states[p1.name].location
				const p2_location = states[p2.name].location
				
				console.log('p1 location', p1_location)
				distance = euclidean_distance(p1_location, p2_location)
				console.log('distance', distance)
				
				force = gravity_force(p1.mass, p2.mass, distance)
				console.log(p1.mass, p2.mass, distance)
				console.log("force: " + force)
				accel_mag = force / p1.mass
				
				console.log('accel_mag', accel_mag)	
				// accel_mag / distance = accel_mag_x / dist_x  = accel_mag_y / dist_y
				
				d_top = p2_location[0] - p1_location[0]
				accel_top = (accel_mag * d_top) / distance
				
				d_left = p2_location[1] - p1_location[1]
				accel_left = (accel_mag * d_left) / distance
				
				accel_vec = [accel_top, accel_left]
				accels_on_p1.push(accel_vec)
			}
		}
	
		console.log("accel_on_p1", accels_on_p1)	
		full_accel = accels_on_p1.reduce((acc, val) => acc.map((a, i) => a + val[i]), [0, 0])
		per_planet_accel[p1.name] = full_accel
		console.log("accels", per_planet_accel)	
	}
	return per_planet_accel
}


// not just for a and v, can be v and x
function scale_add(d_t, a, old_v) {
    const d_v = a.map(c => c * d_t);
    return old_v.map((c, i) => c + d_v[i]);
}

function average(previous, current) { 
    return previous.map((c, i) => (c + current[i]) / 2);
}

function get_next_state(d_t, states, per_planet_accel) {
	const next_states = {}
	
	for (let [planet_name, state] of Object.entries(states)) {
		const new_accel = per_planet_accel[planet_name]		
		
		const next = {}
		next.accel = state.acceleration == null ? new_accel : average(new_accel, state.acceleration)
		
		next.velocity = scale_add(d_t, next.accel, state.velocity)
		next.location = scale_add(d_t, next.velocity, state.location) // distance shouldn't be based off new velocity
		next_states[planet_name] = next
	}	
	return next_states
}

function draw_state(planets, states) {
	const space = document.querySelector(".space")
	
// clear previous
	space.innerHTML = "";

	for (const p of planets) {
		const p_state = states[p.name]
		
		const p_render = document.createElement("div");	
		space.appendChild(p_render)

		p_render.style.width = `${p.radius * 2}px`
		p_render.style.height = `${p.radius * 2}px`
		p_render.style['border-radius'] = "50%" 
		p_render.style.background = "yellow" 
		p_render.style.position = "absolute"
		p_render.style.top = `${p_state.location[0]}px`
		p_render.style.left = `${p_state.location[1]}px`
		p_render.style['margin-left'] = `-${p.radius}px`
		p_render.style['margin-top'] = `-${p.radius}px`
		//console.log(p_render.style.top)
	}
}

let startTime;

function step(timestamp) {

    if (!startTime) {
        startTime = timestamp;
        last_timestamp = timestamp;
    }

    const d_t = (timestamp - last_timestamp) / 1000;
	const per_planet_accel = compute_acceleration_per_planet(planets, states)

	states = get_next_state(d_t, states, per_planet_accel)
    draw_state(planets, states);

    last_timestamp = timestamp;
    window.requestAnimationFrame(step);
}



// start animation
window.onload = function () {
    window.requestAnimationFrame(step);
}


