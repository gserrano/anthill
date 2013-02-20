/*
	Anthill
*/
var Anthill = function(){
	var _hill = this;
	var element = $("#canvas");

	this.global = {
		timer_sleep 	: 7000,
		timer_hungry 	: 7000,
		width			: element.width(),
		height			: element.height(),
		hill_radius		: 8,
		hill_color		: 'rgba(200,20,20,1)',
		ant_color		: 'rgba(240,20,20,1)',
		ant_action_color: 'rgba(240,20,20,0.2)',
		timer 			: 20
	}

	this.ctx = element[0].getContext("2d");

	this.status = {
		population : 0,
		food : 50
	}
	this.ants = {};
	this.foods = {};
	this.trash = {};

	this.create = function(){
		var x = getRandom(0, _hill.global.width-_hill.global.hill_radius),
			y = getRandom(0, _hill.global.width-_hill.global.hill_radius);

		_hill.canvas.circle(x, y, _hill.global.hill_radius, _hill.global.hill_color);
		_hill.position = {
			x : x,
			y : y
		}

		_hill.update();

		
		
	};

	this.create_ant = function() {
		//Anthill should keep track of ants[] attributes, count and own draw functions
		var ant = new this.Ant(_hill).create();
		this.canvas.circle(this.global.x, this.global.y, this.radius);
		this.ants[ant.id] = ant;

		this.status.population += 1;
		this.update();

		return ant;
	}

	this.update = function(){
		$('#food').html(_hill.status.food);
		$('#ants').html(_hill.status.population);
	}

    this.get_idle_ant = function(){
		for (var i in _hill.ants){
			var ant = _hill.ants[i];
			if(ant.status.busy != 1){
				return ant;
			}
		}
    }

    /*
	no need for this.animate; this is an inner method that should not be called outside Anthill
    */
    var animate = function(){
    	_hill.canvas.clear();

    	/* Anthill */
    	_hill.canvas.circle(_hill.position.x, _hill.position.y, _hill.global.hill_radius, _hill.global.hill_color);

    	/* Foods */
		for (var i in _hill.foods){
			var food = _hill.foods[i];
			_hill.canvas.circle(food.position.x, food.position.y, food.radius, food.color);
			_hill.canvas.circle(food.position.x, food.position.y, food.smell, food.smell_color);
		}

    	/* Ants */
		for (var i in _hill.ants){
			var ant = _hill.ants[i],
				to_move_x,
				to_move_y,
				line;

			// console.log(ant.id);
			//alert(ant.toSource());
			if(ant.next_position !== undefined){
				var	to_move_x = ant.next_position.x - ant.position.x,
					to_move_y = ant.next_position.y - ant.position.y,
					pixels = 0;

				if(ant.next_position.x == ant.position.x && ant.next_position.y == ant.position.y){
					ant.next_position = undefined;
					if(typeof(ant.callback) == 'function'){
						ant.callback();
					}
				}else{

					/* 
					Calculate the smallest route (hypotenuse)
					Thanks to Pitagoras and @chrisbenseler
					*/
					var hypotenuse = Math.sqrt((Math.pow(Math.abs(to_move_x),2) + Math.pow(Math.abs(to_move_y),2)));

					/* X */
					if(Math.abs(to_move_x) < (ant.speed)){
						ant.position.x = ant.next_position.x;
					}else{
						if(to_move_x > 0){
							ant.position.x += (to_move_x * ant.speed) / hypotenuse;
						}else{
							ant.position.x -= (Math.abs(to_move_x) * ant.speed) / hypotenuse;
						}
					}

					/* Y */
					if(Math.abs(to_move_y) < (ant.speed)){
						ant.position.y = ant.next_position.y;
					}else{
						if(to_move_y > 0){
							ant.position.y += (to_move_y * ant.speed) / hypotenuse;
						}else{
							ant.position.y -= (Math.abs(to_move_y) * ant.speed) / hypotenuse;
						}
					}
				}

				/* Food colision */
				for (var i in _hill.foods){
					var food = _hill.foods[i];

					var squareX = Math.pow(Math.abs(ant.position.x - food.position.x), 2);
					var squareY = Math.pow(Math.abs(ant.position.y - food.position.y), 2);
					var hypothenuse = Math.sqrt(squareX + squareY);
					var distance = hypothenuse - ant.action_area - food.smell;

					if (distance <= 0) {
						ant.mapInfo.foods[food.id] = {
							creationDate : new Date().getTime(),
							food 		 : food.food,
							position 	 : food.position
						}

						if(ant.status.task == 'searching_food'){
							console.log('Ant found food');
							delete ant.search_angle;
							delete ant.callback;
							ant.status.task == 'go_home';
							ant.go_home();
							// ant.stop();
						}
					}
				}
			}
			
			_hill.canvas.circle(ant.position.x, ant.position.y, ant.action_area, ant.action_color);
			_hill.canvas.circle(ant.position.x, ant.position.y, ant.radius, ant.color);
		}
    }

    this.turn = setInterval(animate, _hill.global.timer);

    /* Canvas */
    this.canvas = {};
    this.canvas.circle = function(x,y,r,color){
    	if(color == undefined){
    		color = "rgba(0,0,255,1)";
    	}

        _hill.ctx.fillStyle = color;
        _hill.ctx.beginPath();
        _hill.ctx.arc(x, y, r, 0, Math.PI*2, true);
        _hill.ctx.closePath();
        _hill.ctx.fill();
    }

    this.canvas.rect = function(x,y,w,h,color){
    	if(color == undefined){
    		color = "rgba(0,0,0,1)";
    	}
        _hill.ctx.fillStyle = color;
        _hill.ctx.beginPath();
        _hill.ctx.rect(x,y,w,h);
        _hill.ctx.closePath();
        _hill.ctx.fill();
    }
    
    this.canvas.clear = function(){
        _hill.ctx.clearRect(0, 0, _hill.global.width,_hill.global.height);
    }

    this.Food = function(){
    	var _food = this;

    	this.create = function(x, y){
    		_food.creationDate = new Date();
    		_food.id = '_' + new Date().getTime();
    		_food.food = 1000;
    		_food.radius = 6;
    		_food.smell = 25;
    		_food.smell_color = 'rgba(0,200,0,0.3)';
    		_food.color = 'rgba(0,200,0,1)';
    		_food.position = {
    			x: x,
    			y: y
    		}
			_hill.canvas.circle(x, y, _food.radius, _food.color);
			_hill.canvas.circle(x, y, _food.smeel, _food.smell_color);
			_hill.foods[_food.id] = this;
    	}
    }

	
}

Anthill.prototype.Ant = function(current_hill){
	var _ant = this;
	var _hill = current_hill;

	this.create = function(opts){
		_ant.creationDate = new Date();
		_ant.id = '_' + new Date().getTime();
		_ant.speed = 0.8;
		_ant.mapInfo = {
			foods 	: {},
			trashes	: {},
			dumps	: {}
		};
		_ant.items = {};
		_ant.gender = getRandom(0,1);
		_ant.position = {
			x : _hill.position.x,
			y : _hill.position.y
		}
		_ant.color = _hill.global.ant_color;
		_ant.radius = 4.5;
		_ant.action_area = 30;
		_ant.action_color = _hill.global.ant_action_color;

		if(opts && opts.type){
			_ant.type = opts.type;
		}else{
			_ant.type = 0;
		}
		
		_ant.status = {
			sleep 		: 0,
			hungry 		: 0,
			busy		: 0
		};

		return this;

		
	}

	/* Search food in map */
	this.search_food = function(){
		/*
			Ant move "randomly" in one direction  find food
		*/

		// console.log(_ant.id + ' searching food');
		_ant.status.busy = 1;
		_ant.status.task = 'searching_food';


		if(_ant.status.search_angle == undefined){
			/* Ant "choose" one direction to go (360° angle) */
			// console.log('redefine angle');
			console.log(_ant.id + ' searching food');
			_ant.status.search_angle = getRandom(0,360);
			_ant.status.search_counter = 0;
		}

		/* only move into canvas */
		if(_ant.position.x < 0){
			console.log('x < 0')
			_ant.status.search_angle = getRandom(45,135);
			console.log(_ant.status.search_angle);
		}else if(_ant.position.x > _hill.global.width){
			console.log('x > w')
			_ant.status.search_angle = getRandom(225,315);
			console.log(_ant.status.search_angle);
		}else if(_ant.position.y < 0){
			console.log('y < 0')
			_ant.status.search_angle = getRandom(135,225);
			console.log(_ant.status.search_angle);
		}else if(_ant.position.y > _hill.global.height){
			console.log('y > h')
			if(getRandom(0,1) == 1){
				_ant.status.search_angle = getRandom(0,89);	
			}else{
				_ant.status.search_angle = 315;
			}
			console.log(_ant.status.search_angle);
		}

		var angle = _ant.status.search_angle;



		if(angle >= 0 && angle < 45){
			/* 0° */
			var gox = getRandom(_ant.position.x - 15, _ant.position.x + 15);
			var goy = getRandom(_ant.position.y - 15, _ant.position.y - 25);
		}else if(angle >= 45 && angle < 90){
			/* 45° */
			var gox = getRandom(_ant.position.x, _ant.position.x + 35);
			var goy = getRandom(_ant.position.y, _ant.position.y - 35);
		}else if(angle >= 90 && angle < 135){
			/* 90° */
			var gox = getRandom(_ant.position.x + 10, _ant.position.x + 30);
			var goy = getRandom(_ant.position.y - 20, _ant.position.y + 20);
		}else if(angle >= 135 && angle < 180){
			/* 135° */
			var gox = getRandom(_ant.position.x, _ant.position.x + 35);
			var goy = getRandom(_ant.position.y, _ant.position.y + 35);
		}else if(angle >= 180 && angle < 225){
			/* 180° */
			var gox = getRandom(_ant.position.x - 15, _ant.position.x + 15);
			var goy = getRandom(_ant.position.y + 15, _ant.position.y + 25);
		}else if(angle >= 225 && angle < 270){
			/* 225 */
			var gox = getRandom(_ant.position.x, _ant.position.x - 35);
			var goy = getRandom(_ant.position.y, _ant.position.y + 35);
		}else if(angle >= 270 && angle < 315){
			/* 225 */
			var gox = getRandom(_ant.position.x - 10, _ant.position.x - 30);
			var goy = getRandom(_ant.position.y - 20, _ant.position.y + 20);
		}else if(angle >= 315){
			/* 315 */
			var gox = getRandom(_ant.position.x, _ant.position.x - 35);
			var goy = getRandom(_ant.position.y, _ant.position.y - 35);
		}

		_ant.go(gox, goy);
		_ant.callback = _ant.search_food;
	}

	/* Stop moving */
	this.stop = function(){
		_ant.next_position = undefined;
	}

	this.eat = function(){
		if(_ant.position.x == _hill.position.x && _ant.position.y == _hill.position.y){
			if(_hill.status.food > 0){
				if(_ant.status.hungry > 0){
					console.log('Eat!');
					_hill.status.food -= 1;
					_ant.status.hungry -= 2;
					_hill.update();
					setTimeout(_ant.eat, 1200);
				}else{
					console.log('Full of food!');
					_ant.status.hungry = 0;
					_ant.status.busy = 0;
					// _ant.sleep();
					// _ant.get_food();
				}
			}
		}else{
			console.log('not in anthill, go home');
			_ant.go_home();
			_ant.callback = _ant.eat;
		}
	}

	/* Die */
	this.die = function(){
		_hill.status.population -= 1;
		_hill.update();
		delete _hill.ants[_ant.id];
	}

	this.go = function(x,y){
		_ant.next_position = {
			x : x,
			y : y
		}
	}

	this.go_home = function(){
		_ant.status.busy = 1;
		_ant.go(_hill.position.x, _hill.position.y);
	}

	this.feed = setInterval(function() {
			_ant.status.hungry += 1;
			if(_ant.status.hungry > 40){
				_ant.die();
			}else if(_ant.status.hungry > 25){
				_ant.status.busy = 1;
				_ant.status.task = 'eating';
				_ant.go_home();
				_ant.callback = function(){
					_ant.callback = undefined;
					console.log('callback feed');
					_ant.eat();
				}
			}
	}, _hill.global.timer_hungry);

		/* Tired ants? */
		// this.sleepy = setInterval(function() {
		// 	_ant.status.sleep += 1;
		// }, _hill.global.timer_sleep);


		/* Old ants dies */
		// _ant.lifetime = getRandom(1200000,1200000);
		// _ant.death = setTimeout(function(){
		// 	_ant.die();
		// },_ant.lifetime);
	//return the self object, to allow chainability
	return this;		
}


function getRandom(from,to){
    return Math.floor(Math.random()*(to-from+1)+from);
}
var hill,
	food,
	f;
$(document).ready(function(){
	/* Create hill */
	hill = new Anthill();
	hill.create();

	/* Create food */
	food = new hill.Food()
	food.create(100,100);

	//can create an Ant in the Hill, name it and make it search for food
	/*
	var my_first_ant = hill.create_ant();
	my_first_ant.search_food();
	*/
	//if you don't need to name the ant, just use chainability
	hill
		.create_ant()
		.search_food();

	/* Get ant and send to search food */

	//var f = hill.get_idle_ant();
	//f.search_food();
	//f.go(200,150);
	// f.eat();
	// f.status.hungry

	//var f2 = new hill.Ant();
	//f2.create();
	//f2.search_food();
})