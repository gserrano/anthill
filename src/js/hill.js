/*
	Anthill
	
	Anthill is an experimental project to build an "ecosystem" of ants with a bottom-up community.
	
	There is no "system rules". Each ant make decisions based on some rules and based on information about 
	food sources and anthill needs that this ant has in that moment.

	Github - https://github.com/gserrano/anthill

*/
function Anthill(){

	var hill = this,
	element = document.getElementById("canvas"),
	_options = {
		timer_sleep		: 7000,
		timer_hungry	: 5000,
		width			: element.offsetWidth,
		height			: element.offsetHeight,
		hill_radius		: 8,
		hill_color		: "rgba(200,20,20,1)",
		ant_color		: "rgba(60,10,10,1)",
		ant_action_color: "rgba(240,20,20,0.01)",
		timer			: 18,
		log 			: false
	},
	_ctx = element.getContext("2d"),
	_status = {
		population : 0,
		food : 50
	},
	_ants = {},
	_foods = {},
	_pheromones = {},
	_trash = {},
	_position;


	/* Utils */
	var _utils = {
		getRandom : function(from,to){
			return Math.floor(Math.random()*(to-from+1)+from);
		},
		objSize : function(obj) {
		  var len = obj.length ? --obj.length : 0;
			for (var k in obj){
				len++;
			}
		  return len;
		}
	}

	/* Canvas */
	var _canvas = {
		circle : function(x,y,r,color){
			if(color === undefined){
				color = "rgba(0,0,255,1)";
			}

			_ctx.fillStyle = color;
			_ctx.beginPath();
			_ctx.arc(x, y, r, 0, Math.PI*2, true);
			_ctx.closePath();
			_ctx.fill();
		},
		rect : function(x,y,w,h,color){
			if(color === undefined){
				color = "rgba(0,0,0,1)";
			}
			_ctx.fillStyle = color;
			_ctx.beginPath();
			_ctx.rect(x,y,w,h);
			_ctx.closePath();
			_ctx.fill();
		},
		clear : function(){
			_ctx.clearRect(0, 0, _options.width, _options.height);
		}
	}


	/* Hill private functions */
	var _hill = {
		create : function(){
			var x = _utils.getRandom(100, _options.width-100),
				y = _utils.getRandom(100, _options.height-100);

			_canvas.circle(x, y, _options.hill_radius, _options.hill_color);
			_position = {
				x : x,
				y : y
			};

			_hill.update();

			hill.createFood();
			setTimeout(function(){
				hill.createFood();
			}, 20);

			setTimeout(function(){
				hill.createFood();
			}, 50);

			// hill.logOn();
			// hill.create();

			var timerAnts = setInterval(function(){
				var ant = hill.createAnt();
				ant.get_food();
			}, 200);

			setTimeout(function(){
				clearInterval(timerAnts);
			}, 8000);
		},
		update : function(){
			document.getElementById('food').innerHTML = _status.food;
			document.getElementById('ants').innerHTML = _utils.objSize(_ants);
		}
	}


	/* Ant */
	function Ant(){
		_ant = this;
		this.creationDate = new Date();
		this.id = '_' + new Date().getTime();
		this.speed = (_utils.getRandom(600,900)/1000);
		this.mapInfo = {
			foods	: {},
			trashes	: {},
			dumps	: {}
		};
		this.items = {
			food	: 0
		};
		this.gender = _utils.getRandom(0,1);
		this.position = {
			x : _position.x,
			y : _position.y
		};
		this.color = _options.ant_color;
		this.radius = 2;
		this.action_area = 30;
		this.action_color = _options.ant_action_color;

		// if(opts && opts.type){
			// this.type = opts.type;
		// }else{
			this.type = 0;
		// }
		
		this.status = {
			sleep		: 0,
			hungry		: _utils.getRandom(0,10),
			busy		: 0,
			task		: {}
		};

		this.list_actions = [];

		_ants[this.id] = this;
		_status.population += 1;
		_hill.update();

		this.lifetime = _utils.getRandom(120000,180000);
		// this.lifetime = 500;

		var death = setTimeout(function(){
			_ant.die();
		},this.lifetime);
	};

	Ant.prototype.log = function(msg) {
		if(console && console.log && _options.log){
			if(typeof msg === 'object'){
				console.log(this.id + ' Object:')
				console.log(msg);
			}else{
				console.log(this.id + ': ' + msg)
			}
		}
	};

	Ant.prototype.create = function(opts){


	};

	Ant.prototype.callback = function(){
		// this.log('callback');
		if(this.list_actions.length > 0){
			var next_action = this.list_actions.shift();
			if(typeof next_action === 'function'){
				// this.log('function');
				next_action.call(this);
			}else if(typeof next_action === 'string' && typeof this[next_action] === 'function'){
				// this.log('string');
				this[next_action].call(this);
			}else if(typeof next_action === 'object'){
				// this.log('object');
				var strToEval = 'next_action[0].call(this';

				for (var i=1; i<next_action.length; i++) {
					strToEval += ',next_action['+i+']';
				}
				strToEval += ');';
				eval(strToEval);
			}
		}
	};

	Ant.prototype.update_food_info = function(food){
		if(!this.mapInfo.foods[food.id]){
			this.mapInfo.foods[food.id] = {
				position	: food.position
			};
		}

		this.mapInfo.foods[food.id].updateDate		= new Date().getTime();
		this.mapInfo.foods[food.id].food			= food.food;

		if(this.status.task && this.status.task.label === 'searching_food' && this.status.task.route){
			this.status.task.route.unshift([_position.x, _position.y]);
			this.status.task.route.push([food.position.x, food.position.y]);
			this.mapInfo.foods[food.id].route = this.status.task.route;
			this.mapInfo.foods[food.id].reverse_route = this.status.task.route.slice().reverse();

			_pheromones[new Date().getTime()] = {
				route : this.status.task.route.slice()
			};
		}
	};

	/* Synchronize ant information */
	Ant.prototype.communicate = function(ant2){
		for (var i in ant2.mapInfo.foods){
			if(this.mapInfo.foods[i] && ant2.mapInfo.foods[i]){
				if(ant2.mapInfo.foods[i].route.length < this.mapInfo.foods[i].route.length){
					this.mapInfo.foods[i].route = ant2.mapInfo.foods[i].route;
				}
			}else{
				this.mapInfo.foods[i] = ant2.mapInfo.foods[i];
			}
		}
	};

	/* 
		arg "route" : array of positions [a,b], [c,d], [d,f]]
		this.status.task.route = object to save route positions
		this.status.task.route.callback: callback called at the end of route
	*/
	Ant.prototype.follow_route = function(route){
		this.log('follow route')
		for (var i in route){
			var position = route[i];
			// this.log(position);

			this.list_actions.push([this.go, position[0], position[1]]);
		}
	};

	Ant.prototype.get_food = function(){
		this.log('get_food');
		this.status.busy = 1;
		this.status.task.label = 'getting_food';

		// console.log(this.id + ' get_food()');

		if(_utils.objSize(this.mapInfo.foods) <= 0){
			this.log('dont know any food source.');
			this.search_food();
			return;
		}

		if(this.items.food <= 0){ 
			// console.log(this.id + ' is going to get food');
			/* Ant is not carring food */

			/* Search one source of food */
			// console.log(this.mapInfo.foods);
			for (var i in this.mapInfo.foods){
				var food = _foods[i];

				// console.log(food);

				/* This source have food? */
				if(food.food > 0){
					if(this.position.x === food.position.x && this.position.y === food.position.y){
						// console.log(this.id + ' get +10 food');
						/* 
						Ant is in this food source, get food to take to the anthill
						*/
						
						getFood = (food.food > 5) ? 5 : food.food;
						this.items.food = getFood;
						food.food -= getFood;
						// console.log(this.mapInfo.foods[i].route);
						this.follow_route(this.mapInfo.foods[i].reverse_route);
					}else{
						this.log(' is going to food source '+ i);
						
						this.follow_route(this.mapInfo.foods[i].route);
					}
					this.list_actions.push(this.get_food);
					this.callback();
					break;
				}
				// break;
			}
		}else{
			if(this.position.x === _position.x && this.position.y === _position.y){
				// console.log(this.id + ' leave +10 food in anthill');
				_status.food += this.items.food;
				this.items.food = 0;
				_hill.update();
				this.get_food();
			}else{
				// console.log('go home');
				this.go_home();
			}
		}
	};

	/* Search food in map */
	Ant.prototype.search_food = function(){
		this.log('search_food');
		
		this.last_position = this.position;

		/*
			Ant move "randomly" in one direction  find food
		*/
		this.status.busy = 1;
		this.status.task.label = 'searching_food';

		if(_utils.objSize(this.mapInfo.foods) > 0){
			// console.log(this.status.task.route);
			this.log('know were food is')
			this.stop();
			this.get_food();
			return;
		}


		if(this.status.task.angle === undefined){
			/* Ant "choose" one direction to go (360° angle) */
			this.log(' define angle to search food');
			this.status.task.angle = _utils.getRandom(0,360);
			this.status.task.route = [];
			this.status.search_counter = 0;
		}

		/* only move into canvas */
		if(this.position.x < 0){
			this.status.task.angle = _utils.getRandom(45,135);
		}else if(this.position.x > _options.width){
			this.status.task.angle = _utils.getRandom(225,315);
		}else if(this.position.y < 0){
			this.status.task.angle = _utils.getRandom(135,225);
		}else if(this.position.y > _options.height){
			if(_utils.getRandom(0,1) === 1){
				this.status.task.angle = _utils.getRandom(0,89);	
			}else{
				this.status.task.angle = 315;
			}
		}

		var angle = this.status.task.angle;


		var gox,
			goy;
		if(angle >= 0 && angle < 45){
			/* 0° */
			gox = _utils.getRandom(this.position.x - 15, this.position.x + 15);
			goy = _utils.getRandom(this.position.y - 15, this.position.y - 25);
		}else if(angle >= 45 && angle < 90){
			/* 45° */
			gox = _utils.getRandom(this.position.x, this.position.x + 35);
			goy = _utils.getRandom(this.position.y, this.position.y - 35);
		}else if(angle >= 90 && angle < 135){
			/* 90° */
			gox = _utils.getRandom(this.position.x + 10, this.position.x + 30);
			goy = _utils.getRandom(this.position.y - 20, this.position.y + 20);
		}else if(angle >= 135 && angle < 180){
			/* 135° */
			gox = _utils.getRandom(this.position.x, this.position.x + 35);
			goy = _utils.getRandom(this.position.y, this.position.y + 35);
		}else if(angle >= 180 && angle < 225){
			/* 180° */
			gox = _utils.getRandom(this.position.x - 15, this.position.x + 15);
			goy = _utils.getRandom(this.position.y + 15, this.position.y + 25);
		}else if(angle >= 225 && angle < 270){
			/* 225 */
			gox = _utils.getRandom(this.position.x, this.position.x - 35);
			goy = _utils.getRandom(this.position.y, this.position.y + 35);
		}else if(angle >= 270 && angle < 315){
			/* 225 */
			gox = _utils.getRandom(this.position.x - 10, this.position.x - 30);
			goy = _utils.getRandom(this.position.y - 20, this.position.y + 20);
		}else if(angle >= 315){
			/* 315 */
			gox = _utils.getRandom(this.position.x, this.position.x - 35);
			goy = _utils.getRandom(this.position.y, this.position.y - 35);
		}
		
		// var goy = this.position.y;
		this.status.task.route.push([gox, goy]);
		// console.log(this.status.task.route)
		this.go(gox, goy);
		this.list_actions.push('search_food');
	};

	/* Stop moving */
	Ant.prototype.stop = function(){
		this.next_position = undefined;
		// delete this.callback;
	};

	Ant.prototype.eat = function(){
		if(this.position.x === _hill.position.x && this.position.y === _hill.position.y){
			if(_status.food > 0){
				if(this.status.hungry > 0){
					console.log('go eat!');
					_status.food -= 1;
					this.status.hungry -= 2;
					_hill.update();
					this.list_actions = [this.eat];
					// this.list_actions.push(this.eat);
					setTimeout(this.callback, 1200);
				}else{
					console.log('Full of food!');
					this.status.hungry = 0;
					this.status.busy = 0;
					this.list_actions.push(this.get_food);
					this.callback();
					// this.sleep();
					// this.get_food();
				}
			}
		}else{
			console.log('Going home to eat.');
			this.list_actions.push(this.go_home);
			this.list_actions.push(this.eat);
			this.callback();
		}
	};

	/* Die */
	Ant.prototype.die = function(){
		this.log('Ant die!');
		// _status.population -= 1;
		delete _ants[this.id];
		_hill.update();
	};

	Ant.prototype.go = function(x,y){
		this.next_position = {
			x : x,
			y : y
		};
	};

	Ant.prototype.go_home = function(){
		this.status.busy = 1;
		this.go(_hill.position.x, _hill.position.y);
	};

	Ant.prototype.feed = function(){
		setInterval(function() {
			this.status.hungry += 1;
			if(this.status.hungry > 30){
				console.log('Die hungry :*');
				this.die();
			}else if(this.status.hungry > 15){
				this.status.busy = 1;
				this.status.task.label = 'eating';
				this.list_actions.push(this.go_home);
				this.list_actions.push(this.eat);
			}
		}, _options.timer_hungry);
	}

	/* Food */
	function Food(){
		var _food = this;
	};

	Food.prototype.create = function(x, y){
		x = (x != undefined) ? x : _utils.getRandom(100, _options.width-100);
		y = (y != undefined) ? y : _utils.getRandom(100, _options.height-100);

		this.creationDate = new Date();
		this.id = '_' + new Date().getTime();
		this.food = 1000;
		this.radius = 5;
		this.smell = 45;
		this.smell_color = 'rgba(0,200,0,0.05)';
		this.color = 'rgba(0,200,0,1)';
		this.position = {
			x: x,
			y: y
		};
		// _circle(x, y, this.radius, this.color);
		_canvas.circle(x, y, this.smeel, this.smell_color);
		_foods[this.id] = this;
	};


	/* Animation */
	var _animate = function(){
		_canvas.clear();

		var	food,
			to_move_x,
			to_move_y,
			pixels,
			line,
			squareX,
			squareY,
			hypothenuse,
			distance;

		/* draw anthill */
		_canvas.circle(_position.x, _position.y, _options.hill_radius, _options.hill_color);

		/* draw foods */
		for (var i in _foods){
			food = _foods[i];
			_canvas.circle(food.position.x, food.position.y, food.radius, food.color);
			_canvas.circle(food.position.x, food.position.y, food.smell, food.smell_color);
		}

		/* Pheromones */
		for (i in _pheromones){
			var pheromone = _pheromones[i];

			_ctx.beginPath();
			_ctx.lineJoin = "round";
			_ctx.strokeStyle = "rgba(25,25,25,0.1)";
			_ctx.moveTo(pheromone.route[0][0],pheromone.route[0][1]);
			for (var j in pheromone.route){
				var position = pheromone.route[j];
				_ctx.lineTo(position[0], position[1]);
			}
			// _ctx.closePath();
			_ctx.stroke();
		}

		/* Ants */
		for (i in _ants){
			ant = _ants[i];

			if(ant.next_position !== undefined){
				to_move_x = ant.next_position.x - ant.position.x;
				to_move_y = ant.next_position.y - ant.position.y;
				pixels = 0;

				if(ant.next_position.x === ant.position.x && ant.next_position.y === ant.position.y){
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
					for(i in _foods){
						food = _foods[i];

						squareX = Math.pow(Math.abs(ant.position.x - food.position.x), 2);
						squareY = Math.pow(Math.abs(ant.position.y - food.position.y), 2);
						hypothenuse = Math.sqrt(squareX + squareY);
						distance = hypothenuse - ant.action_area - food.smell;

						if (distance <= 0) {
							ant.update_food_info(food);
							if(ant.status.task.label === "searching_food"){
								if(ant.status.task.route){
									delete ant.status.task.route;
								}
								ant.callback();
							}
						}
					}

					/* Ants colision */
					for (i in _ants){
						var ant2 = _ants[i];

						/* self collision doesn"t exist */
						if(ant.id !== ant2.id){
							squareX = Math.pow(Math.abs(ant.position.x - ant2.position.x), 2);
							squareY = Math.pow(Math.abs(ant.position.y - ant2.position.y), 2);
							hypothenuse = Math.sqrt(squareX + squareY);
							distance = hypothenuse - ant.action_area - ant2.action_area;

							if (distance <= 0) {
								ant.communicate(ant2);
							}
						}
					}

					// ant.callback();
				}
			}
			
			_canvas.circle(ant.position.x, ant.position.y, ant.action_area, ant.action_color);
			_canvas.circle(ant.position.x, ant.position.y, ant.radius, ant.color);
		}
	};

	_turn = setInterval(_animate, _options.timer);


	/* Public functions */
	hill.createAnt = function(){
		var ant = new Ant();
		// ant.create();
		return ant;
	}

	/* Public functions */
	hill.createFood = function(x,y){
		var food = new Food();
		food.create(x,y);
		return food;
	}

	hill.getAnts = function(){
		return _ants;
	}

	hill.logOn = function(){
		_options.log = true;
	}

	hill.logOff = function(){
		_options.log = false;
	}


	_hill.create();


	/* Clicks */
	element.onclick  = function(e){
		var mouseX = window.event.clientX,
			mouseY = window.event.clientY,
			menu = document.getElementById('action-menu'),
			add_food = document.getElementById('add_food');


		if (e.pageX || e.pageY) {
			canvasX = e.pageX;
			canvasY = e.pageY;
		}
		else {
			canvasX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			canvasY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		canvasX -= element.offsetLeft;
		canvasY -= element.offsetTop;

		for (var i in _hill.ants){
			var ant = _hill.ants[i];

			var squareX = Math.pow(Math.abs(ant.position.x - canvasX), 2);
			var squareY = Math.pow(Math.abs(ant.position.y - canvasY), 2);
			var hypothenuse = Math.sqrt(squareX + squareY);
			var distance = hypothenuse - ant.radius - 10;

			if(distance <= 0){
				ant.die();
				return;
			}
		} 

		menu.style.top = (mouseY+window.scrollY)+'px';
		menu.style.left = mouseX+'px';
		menu.style.display = 'block';

		add_food.onclick = function(){
			hill.createFood(canvasX, canvasY);
		};

		menu.onclick = function(){
			menu.style.display = 'none';
		};


		// var food = new _hill.Food();
		// food.create(mouseX, mouseY);
	};
}


hill = new Anthill();