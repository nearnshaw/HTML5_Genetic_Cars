// Global Vars
toggleLeapMode();


var ghost;

var timeStep = 1.0 / 60.0;

var doDraw = false;
var editMode = true;
var cw_paused = false;
var bluePrintComplete = false;

var box2dfps = 60;
var screenfps = 60;

var debugbox = document.getElementById("debug");

var canvas = document.getElementById("mainbox");
var ctx = canvas.getContext("2d");

var graphcanvas = document.getElementById("graphcanvas");
var graphctx = graphcanvas.getContext("2d");
var graphheight = 200;
var graphwidth = 400;

var minimapcanvas = document.getElementById("minimap");
var minimapctx = minimapcanvas.getContext("2d");
var minimapscale = 3;
var minimapfogdistance = 0;
var minimarkerdistance = document.getElementById("minimapmarker").style;
var fogdistance = document.getElementById("minimapfog").style;


//////////my vars!!!!!!!!!!!!!
var leaparray = new Array();
var leapangles = new Array();
var wheelPos = new Array();
var wheelSize = new Array();
var leap_def = new Object();
var multiFingerOn = true;
var manyFingers = true;
var addWheelMode = false;
var healthBar = 100;



var generationSize = 5;
var cw_carGeneration = new Array();
var cw_carScores = new Array();
var cw_topScores = new Array();
var cw_graphTop = new Array();
var cw_graphElite = new Array();
var cw_graphAverage = new Array();
var cw_graphLeap = new Array();


var gen_champions = 2;
var gen_parentality = 0.2;
var gen_mutation = 0.05;
var gen_counter = 0;
var nAttributes = 14; // change this when genome changes

var gravity = new b2Vec2(0.0, -9.81);
var doSleep = true;

var world = new b2World(gravity, doSleep);

var zoom = 70;

var maxFloorTiles = 200;
var cw_floorTiles = new Array();
var last_drawn_tile = 0;

var groundPieceWidth = 1.5;
var groundPieceHeight = 0.15;

var chassisMaxAxis = 1.1;
var chassisMinAxis = 0.1;

var wheelMaxRadius = 0.5;
var wheelMinRadius = 0.2;
var wheelMaxDensity = 100;
var wheelMinDensity = 40;
var wheelDensityRange = wheelMaxDensity + wheelMinDensity;

var maxVelocityFIFO = 50;
var velocityFIFO = new Array();
var velocityIndex = 0;
var deathSpeed = 0.1;
var max_car_health = box2dfps * 10;
var car_health = max_car_health;


var motorSpeed = 20;

var swapPoint1 = 0;
var swapPoint2 = 0;

var cw_ghostReplayInterval = null;

var distanceMeter = document.getElementById("distancemeter");



//leapstuff

   var leapvars = new Array();
   leapvars.push({
    leapX: 400,
    leapY: 200,
    leapZ: 1,
   });
   







//end leapstuff

function debug(str, clear) {
  if(clear) {
    debugbox.innerHTML = "";
  }
  debugbox.innerHTML += str+"<br />";
}

function showDistance(distance, height) {
  distanceMeter.innerHTML = distance+" meters";
  minimarkerdistance.left = ((distance + 5) * minimapscale) + "px";
  if(distance > minimapfogdistance) {
    fogdistance.width = 800 - (distance + 15) * minimapscale + "px";
    minimapfogdistance = distance;
  }
}

/* ========================================================================= */
/* === Car ================================================================= */
var cw_Car = function() {
  this.__constructor.apply(this, arguments);
}


cw_Car.prototype.chassis = null;
cw_Car.prototype.wheel1 = null;
cw_Car.prototype.wheel2 = null;


cw_Car.prototype.__constructor = function(car_def) {
  this.chassis = cw_createChassis(car_def.vertex_list);
  this.wheel1 = cw_createWheel(car_def.wheel_radius1, car_def.wheel_density1);
  this.wheel2 = cw_createWheel(car_def.wheel_radius2, car_def.wheel_density2);

  var carmass = this.chassis.GetMass() + this.wheel1.GetMass() + this.wheel2.GetMass();
  var torque1 = carmass * -gravity.y / car_def.wheel_radius1;
  var torque2 = carmass * -gravity.y / car_def.wheel_radius2;

  var joint_def = new b2RevoluteJointDef();
  var randvertex = this.chassis.vertex_list[car_def.wheel_vertex1];
  joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
  joint_def.localAnchorB.Set(0, 0);
  joint_def.maxMotorTorque = torque1;
  joint_def.motorSpeed = -motorSpeed;
  joint_def.enableMotor = true;
  joint_def.bodyA = this.chassis;
  joint_def.bodyB = this.wheel1;

  var joint = world.CreateJoint(joint_def);

  randvertex = this.chassis.vertex_list[car_def.wheel_vertex2];
  joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
  joint_def.localAnchorB.Set(0, 0);
  joint_def.maxMotorTorque = torque2;
  joint_def.motorSpeed = -motorSpeed;
  joint_def.enableMotor = true;
  joint_def.bodyA = this.chassis;
  joint_def.bodyB = this.wheel2;

  var joint = world.CreateJoint(joint_def);
}

cw_Car.prototype.getPosition = function() {
  return this.chassis.GetPosition();
}

cw_Car.prototype.draw = function() {
  drawObject(this.chassis);
  drawObject(this.wheel1);
  drawObject(this.wheel2);
}

function cw_createChassisPart(body, vertex1, vertex2) {
  var vertex_list = new Array();
  vertex_list.push(vertex1);
  vertex_list.push(vertex2);
  vertex_list.push(b2Vec2.Make(0,0));
  var fix_def = new b2FixtureDef();
  fix_def.shape = new b2PolygonShape();
  fix_def.density = 80;
  fix_def.friction = 10;
  fix_def.restitution = 0.2;
  fix_def.filter.groupIndex = -1;
  fix_def.shape.SetAsArray(vertex_list,3);

  body.CreateFixture(fix_def);
}

function cw_createChassis(vertex_list) {
  var body_def = new b2BodyDef();
  body_def.type = b2Body.b2_dynamicBody;
  body_def.position.Set(0.0, 4.0);

  var body = world.CreateBody(body_def);

  for(var i=0; i< vertex_list.length; i++)
  {
    var j = i+1;
    
    if(j == vertex_list.length)
    {
     j = 0;
       
    }  
    cw_createChassisPart(body, vertex_list[i],vertex_list[j]);
  }



  body.vertex_list = vertex_list;

  return body;
}

function cw_createWheel(radius, density) {
  var body_def = new b2BodyDef();
  body_def.type = b2Body.b2_dynamicBody;
  body_def.position.Set(0, 0);

  var body = world.CreateBody(body_def);

  var fix_def = new b2FixtureDef();
  fix_def.shape = new b2CircleShape(radius);
  fix_def.density = density;
  fix_def.friction = 1;
  fix_def.restitution = 0.2;
  fix_def.filter.groupIndex = -1;

  body.CreateFixture(fix_def);
  return body;
}

function cw_createRandomCar() {
  var v2;
  var car_def = new Object();
  car_def.wheel_radius1 = Math.random()*wheelMaxRadius+wheelMinRadius;
  car_def.wheel_radius2 = Math.random()*wheelMaxRadius+wheelMinRadius;
  car_def.wheel_density1 = Math.random()*wheelMaxDensity+wheelMinDensity;
  car_def.wheel_density2 = Math.random()*wheelMaxDensity+wheelMinDensity;

  car_def.vertex_list = new Array();
  car_def.vertex_list.push(new b2Vec2(Math.random()*chassisMaxAxis + chassisMinAxis,0));
  car_def.vertex_list.push(new b2Vec2(Math.random()*chassisMaxAxis + chassisMinAxis,Math.random()*chassisMaxAxis + chassisMinAxis));
  car_def.vertex_list.push(new b2Vec2(0,Math.random()*chassisMaxAxis + chassisMinAxis));
  car_def.vertex_list.push(new b2Vec2(-Math.random()*chassisMaxAxis - chassisMinAxis,Math.random()*chassisMaxAxis + chassisMinAxis));
  car_def.vertex_list.push(new b2Vec2(-Math.random()*chassisMaxAxis - chassisMinAxis,0));
  car_def.vertex_list.push(new b2Vec2(-Math.random()*chassisMaxAxis - chassisMinAxis,-Math.random()*chassisMaxAxis - chassisMinAxis));
  car_def.vertex_list.push(new b2Vec2(0,-Math.random()*chassisMaxAxis - chassisMinAxis));
  car_def.vertex_list.push(new b2Vec2(Math.random()*chassisMaxAxis + chassisMinAxis,-Math.random()*chassisMaxAxis - chassisMinAxis));

  car_def.wheel_vertex1 = Math.floor(Math.random()*8)%8;
  v2 = car_def.wheel_vertex1;
  while(v2 == car_def.wheel_vertex1) {
    v2 = Math.floor(Math.random()*8)%8
  }
  car_def.wheel_vertex2 = v2;


  //log all vertexes    carajo
  for (i=0; i<car_def.vertex_list.length; i++)
  {
    console.log("random car vertex_list[" + i +"] : " + car_def.vertex_list[i].x + " and " +  car_def.vertex_list[i].y  );  
  }




  return car_def;
}

/* === LEAP car ============================================================= */


/* =replace all cw_createRandomCar()== w cw_createLeapCar */


/* === END LEAP Car ============================================================= */

/* === END Car ============================================================= */
/* ========================================================================= */

/* ========================================================================= */
/* ==== Floor ============================================================== */

function cw_createFloor() {
  var last_tile = null;
  var tile_position = new b2Vec2(-5,0);
  minimapfogdistance = 0;
  fogdistance.width = "800px";
  minimapctx.clearRect(0,0,minimapcanvas.width,minimapcanvas.height);
  minimapctx.strokeStyle = "#000";
  minimapctx.beginPath();
  minimapctx.moveTo(0,35 * minimapscale);
  for(var k = 0; k < maxFloorTiles; k++) {
    last_tile = cw_createFloorTile(tile_position, (Math.random()*3 - 1.5) * 1.5*k/maxFloorTiles);
    cw_floorTiles.push(last_tile);
    last_fixture = last_tile.GetFixtureList();
    last_world_coords = last_tile.GetWorldPoint(last_fixture.GetShape().m_vertices[3]);
    tile_position = last_world_coords;
    minimapctx.lineTo((tile_position.x + 5) * minimapscale, (-tile_position.y + 35) * minimapscale);
  }
  minimapctx.stroke();
}



function cw_createFloorTile(position, angle) {
  body_def = new b2BodyDef();

  body_def.position.Set(position.x, position.y);
  var body = world.CreateBody(body_def);
  fix_def = new b2FixtureDef();
  fix_def.shape = new b2PolygonShape();
  fix_def.friction = 0.5;

  var coords = new Array();
  coords.push(new b2Vec2(0,0));
  coords.push(new b2Vec2(0,-groundPieceHeight));
  coords.push(new b2Vec2(groundPieceWidth,-groundPieceHeight));
  coords.push(new b2Vec2(groundPieceWidth,0));

  var center = new b2Vec2(0,0);

  var newcoords = cw_rotateFloorTile(coords, center, angle);

  fix_def.shape.SetAsArray(newcoords);

  body.CreateFixture(fix_def);
  return body;
}

function cw_rotateFloorTile(coords, center, angle) {
  var newcoords = new Array();
  for(var k = 0; k < coords.length; k++) {
    nc = new Object();
    nc.x = Math.cos(angle)*(coords[k].x - center.x) - Math.sin(angle)*(coords[k].y - center.y) + center.x;
    nc.y = Math.sin(angle)*(coords[k].x - center.x) + Math.cos(angle)*(coords[k].y - center.y) + center.y;
    newcoords.push(nc);
  }
  return newcoords;
}

/* ==== END Floor ========================================================== */
/* ========================================================================= */

/* ========================================================================= */
/* ==== Generation ========================================================= */

function cw_generationZero() {
  

  //bluePrintComplete = false;
  //leap_turnon();
  //in toogleleapmode -> leap algo -> createLeapCar
  //toggleLeapMode();
  
  //my car
  cw_carGeneration.push(leap_def);


  //the rest random cars   
  for(var k = 1; k < generationSize; k++) {  
    var car_def = cw_createRandomCar();
    cw_carGeneration.push(car_def);
  }

  
  gen_counter = 0;
  document.getElementById("generation").innerHTML = "<h2>Generation 0</h2>";
}

function cw_createNextCar() {
  car_health = max_car_health;
  healthbar = 100;
  cw_clearVelocityFIFO();
  if(current_car_index==0)
  {
    document.getElementById("cars").innerHTML += "<b class='bl'>Hand-made Car:   </b>";
  }
  else
  {
  document.getElementById("cars").innerHTML += "<b  class='rd'>Random Car"+(current_car_index)+": </b>";
  }
  var newcar = new cw_Car(cw_carGeneration[current_car_index]);
  newcar.maxPosition = 0;
  newcar.maxPositiony = 0;
  newcar.minPositiony = 0;
  replay = ghost_create_replay();
  ghost_reset_ghost(ghost);
  ghost_add_replay_frame(replay, newcar);
  newcar.frames = 0;
  return newcar;
}

function cw_killCar() {
  if(typeof myCar !== 'undefined') {
    world.DestroyBody(myCar.chassis);
    world.DestroyBody(myCar.wheel1);
    world.DestroyBody(myCar.wheel2);
  }
}

function cw_clearVelocityFIFO() {
  for(var k = 0; k < maxVelocityFIFO; k++) {
    velocityFIFO[k] = 9999;
  }
}

function cw_nextGeneration() {
  var newGeneration = new Array();
  var newborn;
  cw_getChampions();
  cw_topScores.push({i:gen_counter,v:cw_carScores[0].v,x:cw_carScores[0].x,y:cw_carScores[0].y,y2:cw_carScores[0].y2});
  plot_graphs();
  newGeneration.push(cw_carGeneration[0]);
  for(var k = 0; k < gen_champions; k++) {
    if(cw_carScores[k].i !==0)
      {
        newGeneration.push(cw_carGeneration[cw_carScores[k].i]);
      }
  }
  for(k = gen_champions; k < generationSize; k++) {
    var parent1 = cw_getParents();
    var parent2 = parent1;
    while(parent2 == parent1) {
      parent2 = cw_getParents();
    }
    newborn = cw_makeChild(cw_carGeneration[parent1],cw_carGeneration[parent2]);
    newborn = cw_mutate(newborn);
    newGeneration.push(newborn);
  }
  cw_carScores = new Array();
  cw_carGeneration = newGeneration;
  gen_counter++;
  document.getElementById("generation").innerHTML = "<h2>Generation "+gen_counter + "</h2>";
  document.getElementById("cars").innerHTML = "";
}

function cw_getChampions() {
  var ret = new Array();
  //ret.push(0);
  cw_carScores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
  for(var k = 0; k < generationSize; k++) {
    if(cw_carScores[k].i!==0)
    {
      ret.push(cw_carScores[k].i);
    }
  }
  return ret;
}

function cw_getParents() {
  var parentIndex = -1;
  for(var k = 0; k < generationSize; k++) {
    if(Math.random() <= gen_parentality) {
      parentIndex = k;
      break;
    }
  }
  if(parentIndex == -1) {
    parentIndex = Math.round(Math.random()*(generationSize-1));
  }
  return parentIndex;
}

function cw_makeChild(car_def1, car_def2) {
  var newCarDef = new Object();
  swapPoint1 = Math.round(Math.random()*(nAttributes-1));
  swapPoint2 = swapPoint1;
  while(swapPoint2 == swapPoint1) {
    swapPoint2 = Math.round(Math.random()*(nAttributes-1));
  }
  var parents = [car_def1, car_def2];
  var curparent = 0;

  curparent = cw_chooseParent(curparent,0);
  newCarDef.wheel_radius1 = parents[curparent].wheel_radius1;
  curparent = cw_chooseParent(curparent,1);
  newCarDef.wheel_radius2 = parents[curparent].wheel_radius2;

  curparent = cw_chooseParent(curparent,2);
  newCarDef.wheel_vertex1 = parents[curparent].wheel_vertex1;
  curparent = cw_chooseParent(curparent,3);
  newCarDef.wheel_vertex2 = parents[curparent].wheel_vertex2;

  newCarDef.vertex_list = new Array();
  curparent = cw_chooseParent(curparent,4);
  newCarDef.vertex_list[0] = parents[curparent].vertex_list[0];
  curparent = cw_chooseParent(curparent,5);
  newCarDef.vertex_list[1] = parents[curparent].vertex_list[1];
  curparent = cw_chooseParent(curparent,6);
  newCarDef.vertex_list[2] = parents[curparent].vertex_list[2];
  curparent = cw_chooseParent(curparent,7);
  newCarDef.vertex_list[3] = parents[curparent].vertex_list[3];
  curparent = cw_chooseParent(curparent,8);
  newCarDef.vertex_list[4] = parents[curparent].vertex_list[4];
  curparent = cw_chooseParent(curparent,9);
  newCarDef.vertex_list[5] = parents[curparent].vertex_list[5];
  curparent = cw_chooseParent(curparent,10);
  newCarDef.vertex_list[6] = parents[curparent].vertex_list[6];
  curparent = cw_chooseParent(curparent,11);
  newCarDef.vertex_list[7] = parents[curparent].vertex_list[7];

  curparent = cw_chooseParent(curparent,12);
  newCarDef.wheel_density1 = parents[curparent].wheel_density1;
  curparent = cw_chooseParent(curparent,13);
  newCarDef.wheel_density2 = parents[curparent].wheel_density2;

  return newCarDef;
}

function cw_mutate(car_def) {
  if(Math.random() < gen_mutation)
    car_def.wheel_radius1 = Math.random()*wheelMaxRadius+wheelMinRadius;
  if(Math.random() < gen_mutation)
    car_def.wheel_radius2 = Math.random()*wheelMaxRadius+wheelMinRadius;
  if(Math.random() < gen_mutation)
    car_def.wheel_vertex1 = Math.floor(Math.random()*8)%8;
  if(Math.random() < gen_mutation)
      car_def.wheel_vertex2 = Math.floor(Math.random()*8)%8;
  if(Math.random() < gen_mutation)
    car_def.wheel_density1 = Math.random()*wheelMaxDensity+wheelMinDensity;
  if(Math.random() < gen_mutation)
    car_def.wheel_density2 = Math.random()*wheelMaxDensity+wheelMinDensity;

  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(0,1,new b2Vec2(Math.random()*chassisMaxAxis + chassisMinAxis,0));
  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(1,1,new b2Vec2(Math.random()*chassisMaxAxis + chassisMinAxis,Math.random()*chassisMaxAxis + chassisMinAxis));
  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(2,1,new b2Vec2(0,Math.random()*chassisMaxAxis + chassisMinAxis));
  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(3,1,new b2Vec2(-Math.random()*chassisMaxAxis - chassisMinAxis,Math.random()*chassisMaxAxis + chassisMinAxis));
  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(4,1,new b2Vec2(-Math.random()*chassisMaxAxis - chassisMinAxis,0));
  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(5,1,new b2Vec2(-Math.random()*chassisMaxAxis - chassisMinAxis,-Math.random()*chassisMaxAxis - chassisMinAxis));
  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(6,1,new b2Vec2(0,-Math.random()*chassisMaxAxis - chassisMinAxis));
  if(Math.random() < gen_mutation)
      car_def.vertex_list.splice(7,1,new b2Vec2(Math.random()*chassisMaxAxis + chassisMinAxis,-Math.random()*chassisMaxAxis - chassisMinAxis));
  return car_def;
}

function cw_chooseParent(curparent, attributeIndex) {
  var ret;
  if((swapPoint1 == attributeIndex) || (swapPoint2 == attributeIndex)) {
    if(curparent == 1) {
      ret = 0;
    } else {
      ret = 1;
    }
  } else {
    ret = curparent;
  }
  return ret;
}

function cw_setMutation(mutation) {
  gen_mutation = parseFloat(mutation);
}

function cw_setPopSize(population) {
  generationSize = parseFloat(population);
}

function cw_setEliteSize(clones) {
  gen_champions = parseInt(clones, 10);
}

/* ==== END Genration ====================================================== */
/* ========================================================================= */

/* ========================================================================= */
/* ==== Drawing ============================================================ */

function cw_drawScreen() {
  carPosition = myCar.getPosition();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(200-(carPosition.x*zoom), 200+(carPosition.y*zoom));
  ctx.scale(zoom, -zoom);
  cw_drawFloor();
  ghost_draw_frame(ctx, ghost);
  cw_drawCar();
  ctx.restore();
}

function cw_drawGhostReplay() {
  carPosition = ghost_get_position(ghost);
  showDistance(Math.round(carPosition.x*100)/100, Math.round(carPosition.y*100)/100);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(200-(carPosition.x*zoom), 200+(carPosition.y*zoom));
  ctx.scale(zoom, -zoom);
  ghost_draw_frame(ctx, ghost);
  ghost_move_frame(ghost);
  cw_drawFloor();
  ctx.restore();
}

function cw_drawFloor() {
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#777";
  ctx.lineWidth = 1/zoom;
  ctx.beginPath();

  outer_loop:
  for(var k = Math.max(0,last_drawn_tile-20); k < cw_floorTiles.length; k++) {
    var b = cw_floorTiles[k];
    for (f = b.GetFixtureList(); f; f = f.m_next) {
      var s = f.GetShape();
      var shapePosition = b.GetWorldPoint(s.m_vertices[0]).x;
      if((shapePosition > (carPosition.x - 5)) && (shapePosition < (carPosition.x + 10))) {
        cw_drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
      }
      if(shapePosition > carPosition.x + 10) {
        last_drawn_tile = k;
        break outer_loop;
      }
    }
  }
  ctx.fill();
  ctx.stroke();
}

function cw_drawCar() {
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1/zoom;
  b = myCar.wheel1;
  for (f = b.GetFixtureList(); f; f = f.m_next) {
    var s = f.GetShape();
    var color = Math.round(255 - (255 * (f.m_density - wheelMinDensity)) / wheelMaxDensity).toString();
    var rgbcolor = "rgb("+color+","+color+","+color+")";
    cw_drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
  }
  b = myCar.wheel2;
  for (f = b.GetFixtureList(); f; f = f.m_next) {
    var s = f.GetShape();
    var color = Math.round(255 - (255 * (f.m_density - wheelMinDensity)) / wheelMaxDensity).toString();
    var rgbcolor = "rgb("+color+","+color+","+color+")";
    cw_drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
  }
  if(current_car_index == 0)
  {
    //green
    //ctx.strokeStyle = "#66FF66";
    //ctx.fillStyle = "#C2FFC2";
    //blue
    ctx.strokeStyle = "#33CCCC";
    ctx.fillStyle = "#A8DCFF"; 
  }
  else
  {
    ctx.strokeStyle = "#c44";
    ctx.fillStyle = "#fdd";
  }
  ctx.beginPath();
  var b = myCar.chassis;
  for (f = b.GetFixtureList(); f; f = f.m_next) {
    var s = f.GetShape();
    cw_drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
  }
  ctx.fill();
  ctx.stroke();
}

function toggleDisplay() {
  if(cw_paused) {
    return;
  }
  canvas.width = canvas.width;
  if(doDraw) {
    doDraw = false;
    clearInterval(cw_drawInterval);
    clearInterval(cw_runningInterval);
    cw_runningInterval = setInterval(simulationStep, 1); // simulate 1000x per second when not drawing
  } else {
    doDraw = true;
    cw_drawInterval = setInterval(cw_drawScreen, Math.round(1000/screenfps));
    clearInterval(cw_runningInterval);
    cw_runningInterval = setInterval(simulationStep, Math.round(1000/box2dfps));
  }
}

function cw_drawVirtualPoly(body, vtx, n_vtx) {
  // set strokestyle and fillstyle before call
  // call beginPath before call

  var p0 = body.GetWorldPoint(vtx[0]);
  ctx.moveTo(p0.x, p0.y);
  for (var i = 1; i < n_vtx; i++) {
    p = body.GetWorldPoint(vtx[i]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(p0.x, p0.y);
}

function cw_drawPoly(body, vtx, n_vtx) {
  // set strokestyle and fillstyle before call
  ctx.beginPath();

  var p0 = body.GetWorldPoint(vtx[0]);
  ctx.moveTo(p0.x, p0.y);
  for (var i = 1; i < n_vtx; i++) {
    p = body.GetWorldPoint(vtx[i]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(p0.x, p0.y);

  ctx.fill();
  ctx.stroke();
}

function cw_drawCircle(body, center, radius, angle, color) {
  var p = body.GetWorldPoint(center);
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, 2*Math.PI, true);

  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + radius*Math.cos(angle), p.y + radius*Math.sin(angle));

  ctx.fill();
  ctx.stroke();
}

/* ==== END Drawing ======================================================== */
/* ========================================================================= */


/* ========================================================================= */
/* ==== Graphs ============================================================= */

function cw_storeGraphScores() {
  cw_graphAverage.push(cw_average(cw_carScores));
  cw_graphElite.push(cw_eliteaverage(cw_carScores));
  cw_graphTop.push(cw_carScores[1].v);
  //get position of leapcar in car scores
  var lp = 0;
  for (var l = 0; l < cw_carScores.length; l++)
  {
    if(cw_carScores[l].i == 0)
    {
      lp = l;
    }
  }
  cw_graphLeap.push(cw_carScores[lp].v);
  //cw_graphLeap.push(cw_carScores[0].v);
}

function cw_plotTop() {
  var graphsize = cw_graphTop.length;
  graphctx.strokeStyle = "#f00";
  graphctx.beginPath();
  graphctx.moveTo(0,0);
  for(var k = 0; k < graphsize; k++) {
    graphctx.lineTo(400*(k+1)/graphsize,cw_graphTop[k]);
  }
  graphctx.stroke();
}

function cw_plotElite() {
  var graphsize = cw_graphElite.length;
  graphctx.strokeStyle = "#f00";
  graphctx.beginPath();
  graphctx.moveTo(0,0);
  for(var k = 0; k < graphsize; k++) {
    graphctx.lineTo(400*(k+1)/graphsize,cw_graphElite[k]);
  }
  graphctx.stroke();
}

function cw_plotLeap() {
  var graphsize = cw_graphLeap.length;
  graphctx.strokeStyle = "#00f";
  graphctx.beginPath();
  graphctx.moveTo(0,0);
  for(var k = 0; k < graphsize; k++) {
    graphctx.lineTo(400*(k+1)/graphsize,cw_graphLeap[k]);
  }
  graphctx.stroke();
}


function cw_plotAverage() {
  var graphsize = cw_graphAverage.length;
  graphctx.strokeStyle = "#f00";
  graphctx.beginPath();
  graphctx.moveTo(0,0);
  for(var k = 0; k < graphsize; k++) {
    graphctx.lineTo(400*(k+1)/graphsize,cw_graphAverage[k]);
  }
  graphctx.stroke();
}

function plot_graphs() {
  cw_storeGraphScores();
  cw_clearGraphics();
  //cw_plotAverage();
  //cw_plotElite();
  cw_plotTop();
  cw_listTopScores();
  cw_plotLeap();
}


function cw_eliteaverage(scores) {
  var sum = 0;
  for(var k = 0; k < Math.floor(generationSize/2); k++) {
    sum += scores[k].v;
  }
  return sum/Math.floor(generationSize/2);
}

function cw_average(scores) {
  var sum = 0;
  for(var k = 0; k < generationSize; k++) {
    sum += scores[k].v;
  }
  return sum/generationSize;
}

function cw_clearGraphics() {
  graphcanvas.width = graphcanvas.width;
  graphctx.translate(0,graphheight);
  graphctx.scale(1,-1);
  graphctx.lineWidth = 1;
  graphctx.strokeStyle="#888";
  graphctx.beginPath();
  graphctx.moveTo(0,graphheight/2);
  graphctx.lineTo(graphwidth, graphheight/2);
  graphctx.moveTo(0,graphheight/4);
  graphctx.lineTo(graphwidth, graphheight/4);
  graphctx.moveTo(0,graphheight*3/4);
  graphctx.lineTo(graphwidth, graphheight*3/4);
  graphctx.stroke();
}

function cw_listTopScores() {
  // var ts = document.getElementById("topscores");
  // ts.innerHTML = "Top Scores:<br />";
  // cw_topScores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
  // for(var k = 0; k < Math.min(10,cw_topScores.length); k++) {
  //   document.getElementById("topscores").innerHTML += "#"+(k+1)+": "+Math.round(cw_topScores[k].v*100)/100+" d:"+Math.round(cw_topScores[k].x*100)/100+" h:"+Math.round(cw_topScores[k].y2*100)/100+"/"+Math.round(cw_topScores[k].y*100)/100+"m (gen "+cw_topScores[k].i+")<br />";
  // }
}

/* ==== END Graphs ========================================================= */
/* ========================================================================= */

function simulationStep() {
  world.Step(1/box2dfps, 20, 20);
  ghost_add_replay_frame(replay, myCar);
  ghost_move_frame(ghost);
  myCar.frames++;
  showDistance(Math.round(myCar.getPosition().x*100)/100, Math.round(myCar.getPosition().y*100)/100);
  cw_storeVelocity(Math.abs(myCar.chassis.GetLinearVelocity().x) + Math.abs(myCar.chassis.GetLinearVelocity().y));
  if(cw_checkDeath()) {
    cw_kill();
  }
}

function cw_kill() {
  var avgspeed = (myCar.maxPosition / myCar.frames) * box2dfps;
  var position = myCar.maxPosition;
  var score = position + avgspeed;
  document.getElementById("cars").innerHTML +=  Math.round(score*100)/100 +" points <br />";
  ghost_compare_to_replay(replay, ghost, 0);
  cw_carScores.push({ i:current_car_index, v:score, s: avgspeed, x:position, y:myCar.maxPositiony, y2:myCar.minPositiony });
  current_car_index++;
  cw_killCar();
  if(current_car_index >= generationSize) {
    cw_nextGeneration();
    current_car_index = 0;
  }
  myCar = cw_createNextCar();
  last_drawn_tile = 0;
}

function cw_storeVelocity(velocity) {
  velocityIndex++;
  if(velocityIndex >= maxVelocityFIFO) {
    velocityIndex = 0;
  }
  velocityFIFO[velocityIndex] = velocity;
}

function cw_checkDeath() {
  // check health
  if(myCar.getPosition().y > myCar.maxPositiony) {
    myCar.maxPositiony = myCar.getPosition().y;
  }
  if(myCar.getPosition().y < myCar.minPositiony) {
    myCar.minPositiony = myCar.getPosition().y;
  }
  if(myCar.getPosition().x > myCar.maxPosition) {
    car_health = max_car_health;
    myCar.maxPosition = myCar.getPosition().x;
  } else {
    car_health  -=5;
    healthBar -= 5;
    if(car_health == 0) {
      var healthpercent = 0;
      document.getElementById("health").style.width = healthpercent + "%";
      return true;
    }
  }
  //var healthpercent = car_health*100/(box2dfps * 10);
  //document.getElementById("health").style.width = healthpercent + "%";
  document.getElementById("health").style.width = healthbar + "%";


  // check speed
  var result = 0;
  for(var k = 0; k < maxVelocityFIFO; k++) {
    result += velocityFIFO[k];
  }
  if(result < deathSpeed*maxVelocityFIFO) {
    return true;
  } else {
    return false;
  }
}

function cw_resetPopulation() {
  document.getElementById("generation").innerHTML = "";
  document.getElementById("cars").innerHTML = "";
  document.getElementById("topscores").innerHTML = "";
  cw_clearGraphics();
  cw_carGeneration = new Array();
  cw_carScores = new Array();
  cw_topScores = new Array();
  cw_graphTop = new Array();
  cw_graphLeap = new Array();
  cw_graphElite = new Array();
  cw_graphAverage = new Array();
  velocityFIFO = new Array();
  velocityIndex = 0;
  lastmax = 0;
  lastaverage = 0;
  lasteliteaverage = 0;
  swapPoint1 = 0;
  swapPoint2 = 0;
  cw_killCar();
  cw_clearVelocityFIFO()
  cw_generationZero();
  current_car_index = 0;
  myCar = cw_createNextCar();
  ghost = ghost_create_ghost();
}

function cw_resetWorld() {
  for (b = world.m_bodyList; b; b = b.m_next) {
    world.DestroyBody(b);
  }
  Math.seedrandom(document.getElementById("newseed").value);
  cw_createFloor();
  Math.seedrandom();
  cw_resetPopulation();
}

function cw_confirmResetWorld() {
  if(confirm('Really reset world?')) {
    cw_resetWorld();
  } else {
    return false;
  }
}

// ghost replay stuff

function cw_pauseSimulation() {
  cw_paused = true;
  clearInterval(cw_runningInterval);
  clearInterval(cw_drawInterval);
  old_last_drawn_tile = last_drawn_tile;
  last_drawn_tile = 0;
  ghost_pause(ghost);
}

function cw_resumeSimulation() {
  cw_paused = false;
  ghost_resume(ghost);
  last_drawn_tile = old_last_drawn_tile;
  cw_runningInterval = setInterval(simulationStep, Math.round(1000/box2dfps));
  cw_drawInterval = setInterval(cw_drawScreen, Math.round(1000/screenfps));
}

function cw_startGhostReplay() {
  if(!doDraw) {
    toggleDisplay();
  }
  cw_pauseSimulation();
  cw_ghostReplayInterval = setInterval(cw_drawGhostReplay,Math.round(1000/screenfps));
}

function cw_stopGhostReplay() {
  clearInterval(cw_ghostReplayInterval);
  cw_ghostReplayInterval = null;
  cw_resumeSimulation();
}

function cw_toggleGhostReplay(button) {
  if(cw_ghostReplayInterval == null) {
    cw_startGhostReplay();
    button.value = "Resume simulation";
  } else {
    cw_stopGhostReplay();
    button.value = "View top replay";
  }
}
// ghost replay stuff END


function startThisShit()
{
var oldrandom = Math.seedrandom();
cw_createFloor();

cw_resetPopulation();

cw_runningInterval = setInterval(simulationStep, Math.round(1000/box2dfps));
cw_drawInterval = setInterval(cw_drawScreen, Math.round(1000/screenfps));
}

//--------------------------------------------------
//----------Draw create mode


//-------------IT ALL STARTS HERE!!!!!!!!!!!!!!!!!!!!!!


function toggleLeapMode()
{

    leap_turnon();
  
    leap_drawInterval = setInterval(leap_drawScreen, Math.round(1000/screenfps));
    leap_runningInterval = setInterval(leap_simulationStep, Math.round(1000/box2dfps));
 
}


function leap_drawScreen()
{

  var c=document.getElementById("mainbox");
  var ctx=c.getContext("2d");
  ctx.fillStyle="#FFFFFF";
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle="#FF3399";
  ctx.beginPath();
  ctx.arc(400,200,5,0,2*Math.PI);
  ctx.moveTo(0,200);
  ctx.lineTo(800,200);
  ctx.moveTo(400,0);
  ctx.lineTo(400,400);
  ctx.stroke();
  ctx.closePath();
}



function leap_simulationStep()
{

  var c=document.getElementById("mainbox");
  var ctx=c.getContext("2d");
 //log coords!!!!  
  //console.log("x: " + leapvars.leapX + " y: " + leapvars.leapY + " z: " + leapvars.leapZ);

  if (addWheelMode == false)
  {
    if  (!multiFingerOn)    // or use manyFingers to make it inmediate, no button to change mode
    {

    //instructions
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 18px sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Push one finger forward to add vertexes', 10, 390);


      if(leapvars[0].leapZ < 0.5)
      { 
        ctx.beginPath();
        ctx.fillStyle='red';
        ctx.arc(leapvars[0].leapX,leapvars[0].leapY,12,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
        //rec pos
        //first pos
        if(leaparray.length == 0)
        {
          leaparray.push(new b2Vec2(leapvars[0].leapX,leapvars[0].leapY));
          leapangles.push(getAngle(leapvars[0].leapX, leapvars[0].leapY));

          console.log("X is:" + leapvars[0].leapX + " Y is: "+ leapvars[0].leapY + " and angle is: " + leapangles[leapangles.length-1]);
        }
        else
        {
          if( tooClose(leapvars[0].leapX, leapvars[0].leapY, leaparray[leaparray.length-1].x, leaparray[leaparray.length-1].y)== false)
          {
            leaparray.push(new b2Vec2(leapvars[0].leapX,leapvars[0].leapY));
            leapangles.push(getAngle(leapvars[0].leapX, leapvars[0].leapY));
            console.log("X is:" + leapvars[0].leapX + " Y is: "+ leapvars[0].leapY + " and angle is: " + leapangles[leapangles.length-1]);
            


          }    
        }
      
      }
      else  //leapZ > 0.5   i.e. FAR
      {
        ctx.beginPath();
        ctx.fillStyle='FFEDA9';
        ctx.arc(leapvars[0].leapX,leapvars[0].leapY,30*Math.abs((1-leapvars[0].leapZ)),0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
        
      }

      //draw array so far
      ctx.beginPath();
      ctx.fillStyle='CC3300';
      for(var i = 0; i < leaparray.length; i++)
      {   
        ctx.arc(leaparray[i].x,leaparray[i].y,7,0,2*Math.PI);
      }
      ctx.fill();
      ctx.closePath();

    } //single finger mode close
    else  //multiFingerOn
    {





      for (i=0; i<leapvars.length;i++)
      {
        ctx.beginPath();
        ctx.fillStyle='#FF3300';
        ctx.arc(leapvars[i].leapX,leapvars[i].leapY,30*Math.abs((1-leapvars[i].leapZ)),0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
      }

      //instructions
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 18px sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Position several fingers, then press any key to print vertex positions', 10, 390);



      //draw array so far
      ctx.beginPath();
      ctx.fillStyle='CC3300';
      for(var i = 0; i < leaparray.length; i++)
      {   
        if(leaparray[i].y)
        {
        
        ctx.arc(leaparray[i].x,leaparray[i].y,7,0,2*Math.PI);
        }
      }
      ctx.fill();
      ctx.closePath();





    }
  }  
  else  //wheelmode on
  {

    //instructions
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 18px sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Push forward on vertex to add a wheel and enlarge it. 2 Wheels Max.', 10, 390);





    //draw array
    ctx.beginPath();
    ctx.fillStyle='000066';
    for(var i = 0; i < leaparray.length; i++)
    {
      ctx.arc(leaparray[i].x,leaparray[i].y,7,0,2*Math.PI);
    }
    ctx.fill();
    ctx.closePath();



    //lines for array
    ctx.beginPath();
    ctx.strokeStyle='6699FF';
    ctx.moveTo(leaparray[0].x, leaparray[0].y);
    for(var i = 1; i < leaparray.length; i++)
    {
      ctx.lineTo(leaparray[i].x, leaparray[i].y);
    }
    ctx.lineTo(leaparray[0].x, leaparray[0].y);
    ctx.stroke();
    //ctx.fill();
    ctx.closePath();


    if(leapvars[0].leapZ < 0.5)
    { 
        ctx.beginPath();
        ctx.fillStyle='#00CCFF';
        ctx.arc(leapvars[0].leapX,leapvars[0].leapY,12,0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
        
        //get closest vertex
        var shortest = getDist(leaparray[0].x, leaparray[0].y, leapvars[0].leapX, leapvars[0].leapY)
        var ishortest = 0;
        for(var i = 1; i < leaparray.length; i++)
        {
          var ndist = getDist(leaparray[i].x, leaparray[i].y, leapvars[0].leapX, leapvars[0].leapY);
          if( ndist < shortest)
          {
            shortest = ndist;
            ishortest = i;
          }
        }

        if(shortest<40)
        {
          if(wheelPos.length == 0)
            {
              wheelPos.push(ishortest);
              wheelSize.push(leapvars[0].leapZ);
              console.log("1st wheelpos added " + wheelPos[0]);
            }
          else if (wheelPos.length == 1 && ishortest !== wheelPos[0])
            {
              wheelPos.push(ishortest);
              wheelSize.push(leapvars[0].leapZ);
              console.log("2nd wheelpos added " + wheelPos[1]);
            }
          else if(ishortest !== wheelPos[0] && ishortest !== wheelPos[1])
          {
            wheelPos.shift();
            wheelPos.push(ishortest);
            wheelSize.shift();
            wheelSize.push(leapvars[0].leapZ);
            console.log("wheelpos has " + wheelPos[0] + " and " + wheelPos[1]);
          }
          else if (leapvars[0].leapZ < wheelSize[wheelSize.length-1])   //make wheels larger
          {
            wheelSize[wheelSize.length-1] =leapvars[0].leapZ;
          } 
        }       
     } 
     else  //leapZ > 0.5   FAR
     {
        ctx.beginPath();
        ctx.fillStyle='#0000CC';
        ctx.arc(leapvars[0].leapX,leapvars[0].leapY,30*Math.abs((1-leapvars[0].leapZ)),0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
        
     }        

     //show wheelPos
    ctx.beginPath();
    ctx.fillStyle='006666';
    for(var i=0; i < wheelPos.length;i++)
    {
      var ws = 70-(wheelSize[i]*100);
      ctx.arc(leaparray[wheelPos[i]].x,leaparray[wheelPos[i]].y,ws,0,2*Math.PI);  
    }
    ctx.fill();
    ctx.closePath();

  }
}


function enter_fingers(event)
{
  
  var keycode;
    if (window.event)
    {keycode = window.event.keyCode;}
    else if (event)
    {keycode = event.which;}

    //if(keycode==13)  //enter pressed
    //{
      
      console.log("key pressed :" + keycode);
      //for each finger
      for(i = 0; i<leapvars.length; i++)
      {
          leaparray.push(new b2Vec2(leapvars[i].leapX,leapvars[i].leapY));
          leapangles.push(getAngle(leapvars[i].leapX, leapvars[i].leapY));
          console.log("for finger " + i + " X is:" + leapvars[i].leapX + " Y is: "+ leapvars[i].leapY + " and angle is: " + leapangles[leapangles.length-1]);
      }
    //}

  //console.log("key pressed :" + keycode);
}



function tooClose(x1,y1,x2,y2)
{
  if(Math.abs(x1-x2)<20 && Math.abs(y1-y2)<20)
  {
    return true;
  }
  else
  {
    return false;
  }
}


function getDist(x1,y1,x2,y2)
{
  var dx = Math.abs(x1-x2);
  var dy = Math.abs(y1-y2);
  return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
}

function getAngle(x,y)
{
  x = x-400;
  y= (200-y);
  if(x>0 && y>0)
  {
    var deg = Math.atan(x/y)*(180/Math.PI);
    //console.log("angle is "+deg);
    return deg   //arc tan sohcahtoa  RADIANS  
  }
  else if (x>0 && y<0)
  { 
    var deg = Math.atan(y/x) * (180/Math.PI);
    return (deg*-1)+90;   //arc tan sohcahtoa  RADIANS  
  }
  else if (x<0 && y<0)
  { 
    var deg = Math.atan(x/y) * (180/Math.PI);
    return deg+180;   //arc tan sohcahtoa  RADIANS  
  }
   else if (x<0 && y>0)
  { 
    var deg = Math.atan(y/x) * (180/Math.PI);
    return (deg*-1)+270;   //arc tan sohcahtoa  RADIANS  
  }
}



function cw_createLeapCar()//param array of coordinates and wheelpos
 {
  
  leap_def.vertex_list = new Array();

  if (leaparray.length == 0)
  {
    leap_def.wheel_radius1 = Math.random()*wheelMaxRadius+wheelMinRadius;
    leap_def.wheel_radius2 = Math.random()*wheelMaxRadius+wheelMinRadius;
    leap_def.wheel_density1 = Math.random()*wheelMaxDensity+wheelMinDensity;
    leap_def.wheel_density2 = Math.random()*wheelMaxDensity+wheelMinDensity;
  
    leap_def.vertex_list.push(new b2Vec2(2,0));
    leap_def.vertex_list.push(new b2Vec2(2,2));
    leap_def.vertex_list.push(new b2Vec2(0,2));
    leap_def.vertex_list.push(new b2Vec2(-2,2));
    leap_def.vertex_list.push(new b2Vec2(-2,0));
    leap_def.vertex_list.push(new b2Vec2(-2,-2));
    leap_def.vertex_list.push(new b2Vec2(0,-2));
    leap_def.vertex_list.push(new b2Vec2(2,-2));

    var v2;
    leap_def.wheel_vertex1 = Math.floor(Math.random()*8)%8;
    v2 = leap_def.wheel_vertex1;
    while(v2 == leap_def.wheel_vertex1) {
      v2 = Math.floor(Math.random()*8)%8
    }
    leap_def.wheel_vertex2 = v2;
  }
  else
  {

    



    
    leap_def.wheel_density1 = 75;
    leap_def.wheel_density2 = 75;
  


    for(var i = 0; i < leaparray.length; i++)
    {
      var trueX = (leaparray[i].x-400)/100;
      
      var trueY = (200-leaparray[i].y)/100;
      


      leap_def.vertex_list.push(new b2Vec2(trueX,trueY));
      //alert("x: " + trueX + " y: " + trueY);
    }  


    //if no wheels
    if(wheelPos.length <2)
    {
      leap_def.wheel_radius1 = Math.random()*wheelMaxRadius+wheelMinRadius;
      leap_def.wheel_radius2 = Math.random()*wheelMaxRadius+wheelMinRadius;

      var v2;
      leap_def.wheel_vertex1 = Math.floor(Math.random()*8)%8;
      v2 = leap_def.wheel_vertex1;
      while(v2 == leap_def.wheel_vertex1) 
      {
        v2 = Math.floor(Math.random()*8)%8
      }
      leap_def.wheel_vertex2 = v2;
    }
    else
    {
      leap_def.wheel_vertex1 = wheelPos[0];
      leap_def.wheel_vertex2 = wheelPos[1];

      leap_def.wheel_radius1 = 0.5-wheelSize[0]+0.2;
      leap_def.wheel_radius2 = 0.5-wheelSize[1]+0.2;

    }
    //if wheels use wheelPos

  }   
  

  //log vertexes in all cases
  for (i=0; i<leap_def.vertex_list.length; i++)
  {
    console.log("vertex_list[" + i +"] : " + leap_def.vertex_list[i].x + " and " +  leap_def.vertex_list[i].y  );  
  }
  console.log("wheel vertexes : " + leap_def.wheel_vertex1 + " and " + leap_def.wheel_vertex2);

}


function leap_turnon()
{


    var controller = new Leap.Controller({enableGestures: true});
        var region = new Leap.UI.Region(
          [0, 150, -100], 
          [200, 250, 100]
        );

        controller.addStep(new Leap.UI.Cursor())
        controller.addStep(region.listener({nearThreshold:50}))
        
        controller.loop(function(frame, done) { 
        if (frame.fingers.length == 1) 
        {
              leap_enabled = true;
              manyFingers = false;
              leapvars.length = 1;

              var leapPosition = region.mapToXY(frame.cursorPosition, canvas.width, canvas.height);
              //leapvars[0] = 0;   // para q exista el index en el array, sino no puedo ponerle properties
              leapvars[0].leapX = leapPosition[0];
              leapvars[0].leapY = leapPosition[1];
              leapvars[0].leapZ = leapPosition[2];
        }
        else if (frame.fingers.length > 1 && multiFingerOn == true) 
        {
              leap_enabled = true;
              manyFingers = true;
              leapvars.length = 0;
              for (var i = 0; i < frame.fingers.length; i++) 
              {
                var leapPosition = region.mapToXY(frame.fingers[i].tipPosition, canvas.width, canvas.height);
                
                leapvars.push({
                  leapX : leapPosition[0],
                  leapY : leapPosition[1],
                  leapZ : leapPosition[2],
                });       
              };
        }



          done();
        });

        controller.connection.on('disconnect', function() {
        leap_enabled = false;
        });

}



//stops checking for updates and all that shit
function leap_end()
{
  
   clearInterval(leap_drawInterval);
   clearInterval(leap_runningInterval);
   cw_paused = false;
   multiFingerOn == false;

   old_last_drawn_tile = 1;
   cw_resumeSimulation();

}



function submitBluePrint()
{
  //>>>>>remove editing buttons
  console.log("number of wheels:" + wheelPos.length);
   document.getElementById("menu").style.opacity = "0";
   document.getElementById("menu").innerHTML = "";
   document.getElementById("more_stuff").style.opacity = "0";
   document.getElementById("tablero").style.opacity = "1";

  if(!addWheelMode)
  {
      //order leaparray by getAngle(x,y)
      for (var i = 0; i< leapangles.length; i++)
      {
        for (var j = i+1; j< leapangles.length; j++)
        {
          if(leapangles[i]<leapangles[j])
          {
            var banca = leapangles[i];
            leapangles[i] = leapangles[j];
            leapangles[j] = banca;

            banca = leaparray[i];
            leaparray[i] = leaparray[j];
            leaparray[j] = banca;
          }
        } 
      }
  }

  cw_createLeapCar();
  leap_end();
  startThisShit();

}

function toggleMultiFingerOn()
{
  multiFingerOn = !multiFingerOn;
}

function resetDots()
{
  leaparray.length = 0;
  leapangles.length = 0;
  wheelPos.length = 0;
  addWheelMode = false;

   document.getElementById("adwh").classList.add("btn-primary");
  document.getElementById("create").classList.remove("btn-primary");

}


function deleteLast()
{
  leaparray.pop();
  leapangles.pop();

}

function addWheels(button)
{
  document.getElementById("adwh").classList.remove("btn-primary");
  document.getElementById("create").classList.add("btn-primary");
  addWheelMode = !addWheelMode;


//order leaparray by getAngle(x,y)
  for (var i = 0; i< leapangles.length; i++)
  {
    for (var j = i+1; j< leapangles.length; j++)
    {
      if(leapangles[i]<leapangles[j])
      {
        var banca = leapangles[i];
        leapangles[i] = leapangles[j];
        leapangles[j] = banca;

        banca = leaparray[i];
        leaparray[i] = leaparray[j];
        leaparray[j] = banca;
      }
    }
    
  }
  // if(addWheelMode == true)
  // {
  //   button.value = "Draw shape";
  // }
  // else
  // {
  //   button.value = "Add Wheels";
  // }

  //>>>>>>make submit blueprint only visible as from now!
}