/*
	Anthill
	
	Anthill is an experimental project to build an "ecosystem" of ants with a bottom-up community.
	
	There is no "system rules". Each ant make decisions based on some rules and based on information about 
	food sources and anthill needs that this ant has in that moment.

	Github - https://github.com/gserrano/anthill

*/
function Anthill(){
	var _hill = this;
	var element = document.getElementById('canvas');

	this.global = {
		timer_sleep 	: 7000,
		timer_hungry 	: 7000,
		width			: element.offsetWidth,
		height			: element.offsetHeight,
		hill_radius		: 8,
		hill_color		: 'rgba(200,20,20,1)',
		ant_color		: 'rgba(60,10,10,1)',
		ant_action_color: 'rgba(240,20,20,0.1)',
		timer 			: 20
	}

	this.ctx = element.getContext("2d");

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
	}

	this.update = function(){
		document.getElementById('food').innerHTML = _hill.status.food;
		document.getElementById('ants').innerHTML = _hill.status.population;
	}

    this.get_idle_ant = function(){
		for (var i in _hill.ants){
			var ant = _hill.ants[i];
			if(ant.status.busy != 1){
				return ant;
			}
		}
    }

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

			// console.log(ant.callback);

			if(ant.next_position !== undefined){
				var	to_move_x = ant.next_position.x - ant.position.x,
					to_move_y = ant.next_position.y - ant.position.y,
					pixels = 0;

				if(ant.next_position.x == ant.position.x && ant.next_position.y == ant.position.y){
					ant.next_position = undefined;
					ant.callback();
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

					/* Food colision */
					for (var i in _hill.foods){
						var food = _hill.foods[i];

						var squareX = Math.pow(Math.abs(ant.position.x - food.position.x), 2);
						var squareY = Math.pow(Math.abs(ant.position.y - food.position.y), 2);
						var hypothenuse = Math.sqrt(squareX + squareY);
						var distance = hypothenuse - ant.action_area - food.smell;

						if (distance <= 0) {
							ant.update_food_info(food);
							if(ant.status.task.label == 'searching_food'){
								console.log(ant.id + ' found food!');
								if(ant.status.task.route){
									delete ant.status.task.route;
								}
								ant.callback();
							}
						}
					}

					/* Ants colision */
					for (var i in _hill.ants){
						var ant2 = _hill.ants[i];

						/* self collision doesn't exist */
						if(ant.id != ant2.id){
							var squareX = Math.pow(Math.abs(ant.position.x - ant2.position.x), 2);
							var squareY = Math.pow(Math.abs(ant.position.y - ant2.position.y), 2);
							var hypothenuse = Math.sqrt(squareX + squareY);
							var distance = hypothenuse - ant.action_area - ant2.action_area;

							if (distance <= 0) {
								ant.communicate(ant2);
							}
						}
					}

					// ant.callback();
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
    		_food.radius = 5;
    		_food.smell = 45;
    		_food.smell_color = 'rgba(0,200,0,0.1)';
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
			_ant.speed = 0.8;
			_ant.mapInfo = {
				foods 	: {},
				trashes	: {},
				dumps	: {}
			};
			_ant.items = {
				food 	: 0
			};
			_ant.gender = getRandom(0,1);
			_ant.position = {
				x : _hill.position.x,
				y : _hill.position.y
			}
			_ant.color = _hill.global.ant_color;
			_ant.radius = 3;
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
				busy		: 0,
				task		: {}
			}

			_ant.list_actions = [];

			_hill.ants[_ant.id] = this;
			_hill.status.population += 1;
			_hill.update();
		}

		/* 
			Read _ant.list_actions array [[console.log(), param1], [alert(), b]]
			execute the first action and shift _ant.list_actions

		*/ 
		this.callback = function(){
			if(_ant.list_actions.length > 0){
				var next_action = _ant.list_actions.shift();
				if(typeof next_action == 'function'){
					next_action();
				}else if(typeof next_action == 'object'){
					var strToEval = 'next_action[0](';

					for (var i=1; i<next_action.length; i++) {
						if(i == (next_action.length-1)){
							strToEval += 'next_action['+i+']';
						}else{
							strToEval += 'next_action['+i+'],';
						}
						
					}
					strToEval += ');';
					eval(strToEval);
				}

			}
		}

		this.update_food_info = function(food){
			// console.log('update_food_info');
			// console.log(_ant.task);
			if(!_ant.mapInfo.foods[food.id]){
				_ant.mapInfo.foods[food.id] = {
					position 	: food.position
				}
			}

			_ant.mapInfo.foods[food.id].updateDate 	= new Date().getTime();
			_ant.mapInfo.foods[food.id].food 			= food.food;
			
			if(_ant.status.task && _ant.status.task.label == 'searching_food' && _ant.status.task.route){
				_ant.status.task.route.unshift([_hill.position.x, _hill.position.y]);
				_ant.status.task.route.push([food.position.x, food.position.y]);
				_ant.mapInfo.foods[food.id].route = _ant.status.task.route;
				_ant.mapInfo.foods[food.id].reverse_route = _ant.status.task.route.slice().reverse();
			}
		}

		/* Synchronize ant information */
		this.communicate = function(ant2){
			// console.log('communicate()');

			for (var i in ant2.mapInfo.foods){
				if(_ant.mapInfo.foods[i]){
					if(ant2.mapInfo.foods[i].route.length < _ant.mapInfo.foods[i].route.length){
						_ant.mapInfo.foods[i].route = ant2.mapInfo.foods[i].route;
					}
					// if(ant2.mapInfo.foods[i].updateDate > _ant.mapInfo.foods[i].updateDate){
					// 	_ant.mapInfo.foods[i] = ant2.mapInfo.foods[i];
					// 	console.log(_ant.id + ' get info about food')
					// }
				}else{
					_ant.mapInfo.foods[i] = ant2.mapInfo.foods[i];
				}
			}
		}

		/* 
			arg "route" : array of positions [a,b], [c,d], [d,f]]
			_ant.status.task.route = object to save route positions
			_ant.status.task.route.callback: callback called at the end of route
		*/
		this.follow_route = function(route){

			for (var i in route){
				var position = route[i];
				// console.log(position);

				_ant.list_actions.push([_ant.go, position[0], position[1]]);
			}

		}

		this.get_food = function(){
			_ant.status.busy = 1;
			_ant.status.task.label = 'getting_food';

			// console.log(_ant.id + ' get_food()');

			if(objSize(_ant.mapInfo.foods) <= 0){
				console.log(_ant.id + ' dont know any food source.');
				_ant.search_food();
				return;
			}

			if(_ant.items.food <= 0){ 
				console.log(_ant.id + ' is going to get food');
				/* Ant is not carring food */

				/* Search one source of food */
				// console.log(_ant.mapInfo.foods);
				for (var i in _ant.mapInfo.foods){
					var food = _hill.foods[i];

					/* This source have food? */
					if(food.food > 0){
						if(_ant.position.x == food.position.x && _ant.position.y == food.position.y){
							console.log(_ant.id + ' get +10 food');
							/* 
							Ant is in this food source, get food to take to the anthill
							*/
							
							getFood = (food.food > 10) ? 10 : food.food;
							_ant.items.food = getFood;
							food.food -= getFood;
							// console.log(_ant.mapInfo.foods[i].route);
							_ant.follow_route(_ant.mapInfo.foods[i].reverse_route);
						}else{
							console.log(_ant.id + ' is going to food source '+ i);
							
							_ant.follow_route(_ant.mapInfo.foods[i].route);
						}
						_ant.list_actions.push(_ant.get_food);
						_ant.callback();
						break;
					}
					// break;
				}
			}else{
				if(_ant.position.x == _hill.position.x && _ant.position.y == _hill.position.y){
					console.log(_ant.id + ' leave +10 food in anthill');
					_hill.status.food += _ant.items.food;
					_ant.items.food = 0;
					_hill.update();
					_ant.get_food();
				}else{
					console.log('go home');
					_ant.go_home();
				}
			}
		}

		/* Search food in map */
		this.search_food = function(){
			/*
				Ant move "randomly" in one direction  find food
			*/
			_ant.status.busy = 1;
			_ant.status.task.label = 'searching_food';

			if(objSize(_ant.mapInfo.foods) > 0){
				// console.log(_ant.status.task.route);
				console.log(_ant.id + ' know were food is')
				_ant.stop();
				_ant.get_food();
				return;
			}


			if(_ant.status.task.angle == undefined){
				/* Ant "choose" one direction to go (360° angle) */
				console.log(_ant.id + ' searching food');
				_ant.status.task.angle = getRandom(0,360);
				_ant.status.task.route = [];
				_ant.status.search_counter = 0;
			}

			/* only move into canvas */
			if(_ant.position.x < 0){
				console.log('x < 0')
				_ant.status.task.angle = getRandom(45,135);
				console.log(_ant.status.task.angle);
			}else if(_ant.position.x > _hill.global.width){
				console.log('x > w')
				_ant.status.task.angle = getRandom(225,315);
				console.log(_ant.status.task.angle);
			}else if(_ant.position.y < 0){
				console.log('y < 0')
				_ant.status.task.angle = getRandom(135,225);
				console.log(_ant.status.task.angle);
			}else if(_ant.position.y > _hill.global.height){
				console.log('y > h')
				if(getRandom(0,1) == 1){
					_ant.status.task.angle = getRandom(0,89);	
				}else{
					_ant.status.task.angle = 315;
				}
				console.log(_ant.status.task.angle);
			}

			var angle = _ant.status.task.angle;



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
			
			// var goy = _ant.position.y;
			_ant.status.task.route.push([gox, goy]);
			// console.log(_ant.status.task.route)
			_ant.go(gox, goy);
			_ant.list_actions.push(_ant.search_food);

		}

		/* Stop moving */
		this.stop = function(){
			_ant.next_position = undefined;
			// delete _ant.callback;
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
				_ant.status.task.label = 'eating';
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

function objSize(obj) {
  var len = obj.length ? --obj.length : 0;
    for (var k in obj)
      len++;
  return len;
}