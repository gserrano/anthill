var hill,
	food,
	f;

/* Scripts to test anthill */

/* Create hill */
hill = new Anthill();
hill.create();


/* Create food */
// function createFood(){
// 	food = new hill.Food();
// 	// food.create(getRandom(25,hill.global.width-225),getRandom(25,hill.global.height-25));
// 	// food.create(130,50)
// }

// createFood();

/* Create ant */
var counter = 0;
// function createAnt(){
// 	var timer;
// 	console.log('A new ant was born. Go work!');
// 	f = new hill.Ant();
// 	f.create();
// 	f.search_food();
// 	if(counter < 35){
// 		timer = getRandom(300, 2500);
// 	}else{
// 		timer = getRandom(60000, 90000);
// 	}
// 	counter++;
// 	setTimeout(createAnt,timer);
// }

// createAnt();
// createFood();


f = new hill.Ant();
f.create();
f.search_food();