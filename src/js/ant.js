function lorem(){
	return 'abc';
}

self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage('WORKER STARTED: ' + data.msg);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg + '. (buttons will no longer work)');
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);



this.Ant = function(){
	var _ant = this;



	/* 
		Read _ant.list_actions array [[console.log(), param1], [alert(), b]]
		execute the first action and shift _ant.list_actions

	*/ 
	this.callback = function(){
		if(_ant.list_actions.length > 0){
			var next_action = _ant.list_actions.shift();
			if(typeof next_action === 'function'){
				next_action();
			}else if(typeof next_action === 'object'){
				var strToEval = 'next_action[0](';

				for (var i=1; i<next_action.length; i++) {
					if(i === (next_action.length-1)){
						strToEval += 'next_action['+i+']';
					}else{
						strToEval += 'next_action['+i+'],';
					}
					
				}
				strToEval += ');';
				eval(strToEval);
			}
		}
	};

	this.update_food_info = function(food){
		// console.log('update_food_info');
		// console.log(_ant.task);
		if(!_ant.mapInfo.foods[food.id]){
			_ant.mapInfo.foods[food.id] = {
				position	: food.position
			};
		}

		_ant.mapInfo.foods[food.id].updateDate		= new Date().getTime();
		_ant.mapInfo.foods[food.id].food			= food.food;

		if(_ant.status.task && _ant.status.task.label === 'searching_food' && _ant.status.task.route){
			_ant.status.task.route.unshift([_hill.position.x, _hill.position.y]);
			_ant.status.task.route.push([food.position.x, food.position.y]);
			_ant.mapInfo.foods[food.id].route = _ant.status.task.route;
			_ant.mapInfo.foods[food.id].reverse_route = _ant.status.task.route.slice().reverse();

			_hill.pheromones[new Date().getTime()] = {
				route : _ant.status.task.route.slice()
			};
		}
	};

	/* Synchronize ant information */
	this.communicate = function(ant2){
		// console.log('communicate()');

		for (var i in ant2.mapInfo.foods){
			if(_ant.mapInfo.foods[i] && ant2.mapInfo.foods[i]){
				if(ant2.mapInfo.foods[i].route.length < _ant.mapInfo.foods[i].route.length){
					_ant.mapInfo.foods[i].route = ant2.mapInfo.foods[i].route;
				}
				//if(ant2.mapInfo.foods[i].updateDate > _ant.mapInfo.foods[i].updateDate){
				//	_ant.mapInfo.foods[i] = ant2.mapInfo.foods[i];
				//	console.log(_ant.id + ' get info about food')
				//}
			}else{
				_ant.mapInfo.foods[i] = ant2.mapInfo.foods[i];
			}
		}
	};

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

	};

	this.get_food = function(){
		_ant.status.busy = 1;
		_ant.status.task.label = 'getting_food';

		// console.log(_ant.id + ' get_food()');

		if(objSize(_ant.mapInfo.foods) <= 0){
			// console.log(_ant.id + ' dont know any food source.');
			_ant.search_food();
			return;
		}

		if(_ant.items.food <= 0){ 
			// console.log(_ant.id + ' is going to get food');
			/* Ant is not carring food */

			/* Search one source of food */
			// console.log(_ant.mapInfo.foods);
			for (var i in _ant.mapInfo.foods){
				var food = _hill.foods[i];

				/* This source have food? */
				if(food.food > 0){
					if(_ant.position.x === food.position.x && _ant.position.y === food.position.y){
						// console.log(_ant.id + ' get +10 food');
						/* 
						Ant is in this food source, get food to take to the anthill
						*/
						
						getFood = (food.food > 5) ? 5 : food.food;
						_ant.items.food = getFood;
						food.food -= getFood;
						// console.log(_ant.mapInfo.foods[i].route);
						_ant.follow_route(_ant.mapInfo.foods[i].reverse_route);
					}else{
						// console.log(_ant.id + ' is going to food source '+ i);
						
						_ant.follow_route(_ant.mapInfo.foods[i].route);
					}
					_ant.list_actions.push(_ant.get_food);
					_ant.callback();
					break;
				}
				// break;
			}
		}else{
			if(_ant.position.x === _hill.position.x && _ant.position.y === _hill.position.y){
				// console.log(_ant.id + ' leave +10 food in anthill');
				_hill.status.food += _ant.items.food;
				_ant.items.food = 0;
				_hill.update();
				_ant.get_food();
			}else{
				// console.log('go home');
				_ant.go_home();
			}
		}
	};

	/* Search food in map */
	this.search_food = function(){
		/*
			Ant move "randomly" in one direction  find food
		*/
		_ant.status.busy = 1;
		_ant.status.task.label = 'searching_food';

		if(objSize(_ant.mapInfo.foods) > 0){
			// console.log(_ant.status.task.route);
			// console.log(_ant.id + ' know were food is')
			_ant.stop();
			_ant.get_food();
			return;
		}


		if(_ant.status.task.angle === undefined){
			/* Ant "choose" one direction to go (360° angle) */
			// console.log(_ant.id + ' searching food');
			_ant.status.task.angle = getRandom(0,360);
			_ant.status.task.route = [];
			_ant.status.search_counter = 0;
		}

		/* only move into canvas */
		if(_ant.position.x < 0){
			// console.log('x < 0')
			_ant.status.task.angle = getRandom(45,135);
			// console.log(_ant.status.task.angle);
		}else if(_ant.position.x > _hill.global.width){
			// console.log('x > w')
			_ant.status.task.angle = getRandom(225,315);
			// console.log(_ant.status.task.angle);
		}else if(_ant.position.y < 0){
			// console.log('y < 0')
			_ant.status.task.angle = getRandom(135,225);
			// console.log(_ant.status.task.angle);
		}else if(_ant.position.y > _hill.global.height){
			// console.log('y > h')
			if(getRandom(0,1) === 1){
				_ant.status.task.angle = getRandom(0,89);	
			}else{
				_ant.status.task.angle = 315;
			}
			// console.log(_ant.status.task.angle);
		}

		var angle = _ant.status.task.angle;


		var gox,
			goy;
		if(angle >= 0 && angle < 45){
			/* 0° */
			gox = getRandom(_ant.position.x - 15, _ant.position.x + 15);
			goy = getRandom(_ant.position.y - 15, _ant.position.y - 25);
		}else if(angle >= 45 && angle < 90){
			/* 45° */
			gox = getRandom(_ant.position.x, _ant.position.x + 35);
			goy = getRandom(_ant.position.y, _ant.position.y - 35);
		}else if(angle >= 90 && angle < 135){
			/* 90° */
			gox = getRandom(_ant.position.x + 10, _ant.position.x + 30);
			goy = getRandom(_ant.position.y - 20, _ant.position.y + 20);
		}else if(angle >= 135 && angle < 180){
			/* 135° */
			gox = getRandom(_ant.position.x, _ant.position.x + 35);
			goy = getRandom(_ant.position.y, _ant.position.y + 35);
		}else if(angle >= 180 && angle < 225){
			/* 180° */
			gox = getRandom(_ant.position.x - 15, _ant.position.x + 15);
			goy = getRandom(_ant.position.y + 15, _ant.position.y + 25);
		}else if(angle >= 225 && angle < 270){
			/* 225 */
			gox = getRandom(_ant.position.x, _ant.position.x - 35);
			goy = getRandom(_ant.position.y, _ant.position.y + 35);
		}else if(angle >= 270 && angle < 315){
			/* 225 */
			gox = getRandom(_ant.position.x - 10, _ant.position.x - 30);
			goy = getRandom(_ant.position.y - 20, _ant.position.y + 20);
		}else if(angle >= 315){
			/* 315 */
			gox = getRandom(_ant.position.x, _ant.position.x - 35);
			goy = getRandom(_ant.position.y, _ant.position.y - 35);
		}
		
		// var goy = _ant.position.y;
		_ant.status.task.route.push([gox, goy]);
		// console.log(_ant.status.task.route)
		_ant.go(gox, goy);
		_ant.list_actions.push(_ant.search_food);

	};

	/* Stop moving */
	this.stop = function(){
		_ant.next_position = undefined;
		// delete _ant.callback;
	};

	this.eat = function(){
		if(_ant.position.x === _hill.position.x && _ant.position.y === _hill.position.y){
			if(_hill.status.food > 0){
				if(_ant.status.hungry > 0){
					console.log('go eat!');
					_hill.status.food -= 1;
					_ant.status.hungry -= 2;
					_hill.update();
					_ant.list_actions = [_ant.eat];
					// _ant.list_actions.push(_ant.eat);
					setTimeout(_ant.callback, 1200);
				}else{
					console.log('Full of food!');
					_ant.status.hungry = 0;
					_ant.status.busy = 0;
					_ant.list_actions.push(_ant.get_food);
					_ant.callback();
					// _ant.sleep();
					// _ant.get_food();
				}
			}
		}else{
			console.log('Going home to eat.');
			_ant.list_actions.push(_ant.go_home);
			_ant.list_actions.push(_ant.eat);
			_ant.callback();
		}
	};

	/* Die */
	this.die = function(){
		console.log('Ant die!');
		// _hill.status.population -= 1;
		_hill.update();
		delete _hill.ants[_ant.id];
	};

	this.go = function(x,y){
		_ant.next_position = {
			x : x,
			y : y
		};
	};

	this.go_home = function(){
		_ant.status.busy = 1;
		_ant.go(_hill.position.x, _hill.position.y);
	};

	this.feed = setInterval(function() {
		_ant.status.hungry += 1;
		if(_ant.status.hungry > 30){
			console.log('Die hungry :*');
			_ant.die();
		}else if(_ant.status.hungry > 15){
			_ant.status.busy = 1;
			_ant.status.task.label = 'eating';
			_ant.list_actions.push(_ant.go_home);
			_ant.list_actions.push(_ant.eat);
		}
	}, _hill.global.timer_hungry);

	/* Tired ants? */
	//this.sleepy = setInterval(function() {
	//	_ant.status.sleep += 1;
	//}, _hill.global.timer_sleep);


	/* Old ants dies */
	_ant.lifetime = getRandom(120000,180000);
	var death = setTimeout(function(){
		_ant.die();
	},_ant.lifetime);
	
};