/*
	Anthill
*/
function Anthill(){
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
		timer 			: 50
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

		var f = new _hill.Ant();
		f.create();
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

    this.animate = function(){
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
					Thanks to Pitagoras and @chrisb
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
							console.log('Ant found food')
							ant.stop();
						}
					}
				}

			}
			
			_hill.canvas.circle(ant.position.x, ant.position.y, ant.action_area, ant.action_color);
			_hill.canvas.circle(ant.position.x, ant.position.y, ant.radius, ant.color);
		}
    }

    this.turn = setInterval(_hill.animate, _hill.global.timer);

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

	this.Ant = function(){
		var _ant = this;

		this.create = function(opts){
			_ant.creationDate = new Date();
			_ant.id = '_' + new Date().getTime();
			_ant.speed = 2.5;
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
			}

			_hill.canvas.circle(_hill.global.x, _hill.global.y, _hill.radius);
			_hill.ants[_ant.id] = this;

			_hill.status.population += 1;
			_hill.update();
		}

		/* Search food in map */
		this.search = function(){
			_ant.status.busy = 1;
			_ant.status.task = 'searching_food';
			f.go(0,0)
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
		
	}
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
	food.create(100,100)

	/* Get ant and send to search food */
	f = hill.get_idle_ant()
	// f.search();
	// f.go(200,150);
	// f.eat();
	// f.status.hungry
})