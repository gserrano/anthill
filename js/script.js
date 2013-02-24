var hill,
	food,
	f;

/* Scripts to test anthill */


/* Create hill */
hill = new Anthill();
hill.create();


/* Create food */
function createFood(){
	food = new hill.Food()
	food.create(getRandom(0,hill.global.width),getRandom(0,hill.global.height))
}

createFood();

/* Create ant */
function createAnt(){
	f = new hill.Ant();
	f.create();
	f.search_food();
}


createAnt();
createFood();
setTimeout(createAnt, 500);
setTimeout(createAnt, 950);
setTimeout(createAnt, 1500);
setTimeout(createAnt, 2900);
setTimeout(createAnt, 3900);
setTimeout(createAnt, 5300);