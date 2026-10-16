// Variables globales que van siempre
var renderer, scene, camera;
var cameraMini; 
var cameraControls;
var materialesRobot = []; 
var effectController; 

// Controles de primera persona (Copiados de heightmap.js)
const controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    speed: 10
};

// Event listeners para controles (Copiados de heightmap.js)
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            controls.moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            controls.moveRight = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            controls.moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            controls.moveRight = false;
            break;
    }
});

init();
loadScene();
setupGUI();
render();

function init()
{
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(new THREE.Color(0xFFFFFF));
  renderer.autoClear = false;
  // Activamos las sombras
  renderer.shadowMap.enabled = true;
  document.getElementById('container').appendChild(renderer.domElement);

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 2000);
  camera.position.set(300, 280, 300);

  cameraMini = new THREE.OrthographicCamera(-150, 150, 150, -150, 0.1, 2000);
  cameraMini.position.set(0, 500, 0); 
  cameraMini.lookAt(0, 0, 0);
  cameraMini.up.set(0, 0, -1);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 140, 0); 

  window.addEventListener('resize', updateAspectRatio);
}

function loadScene()
{
  // --- HABITACIÓN ---
  let materialesHabitacion = [];
  materialesHabitacion.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("images/posx.jpg"), side: THREE.BackSide }));
  materialesHabitacion.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("images/negx.jpg"), side: THREE.BackSide }));
  materialesHabitacion.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("images/posy.jpg"), side: THREE.BackSide }));
  materialesHabitacion.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("images/negy.jpg"), side: THREE.BackSide }));
  materialesHabitacion.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("images/posz.jpg"), side: THREE.BackSide }));
  materialesHabitacion.push(new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("images/negz.jpg"), side: THREE.BackSide }));

  let habitacion = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1000), materialesHabitacion);
  habitacion.position.y = 499;
  scene.add(habitacion);

  // --- MATERIALES ---
  // Configura un material
  var texSuelo = new THREE.TextureLoader().load( 'images/pisometalico_1024.jpg' );
  texSuelo.wrapS = texSuelo.wrapT = THREE.RepeatWrapping;
  texSuelo.repeat.set(4, 4);
  var matSuelo = new THREE.MeshLambertMaterial( { map: texSuelo, side: THREE.DoubleSide } );

  // Configura un material
  var texMadera = new THREE.TextureLoader().load( 'images/wood512.jpg' );
  var matBase = new THREE.MeshLambertMaterial( { map: texMadera } );
  var matEsparrago = new THREE.MeshLambertMaterial( { map: texMadera } );
  var matNervio = new THREE.MeshLambertMaterial( { map: texMadera } );
  var matPinza = new THREE.MeshLambertMaterial( { map: texMadera } );

  // Configura un material
  var texMetal = new THREE.TextureLoader().load( 'images/metal_128.jpg' );
  var matEje = new THREE.MeshPhongMaterial( { map: texMetal, shininess: 50 } );
  var matDisco = new THREE.MeshPhongMaterial( { map: texMetal } );
  var matMano = new THREE.MeshPhongMaterial( { map: texMetal } );

  // Configura un material (para la rotula)
  var urlsHabitacion = [
    "images/posx.jpg", "images/negx.jpg",
    "images/posy.jpg", "images/negy.jpg",
    "images/posz.jpg", "images/negz.jpg"
  ];
  var entorno = new THREE.CubeTextureLoader().load(urlsHabitacion); 
  var matRotula = new THREE.MeshPhongMaterial( { envMap: entorno, color: 0xffffff, reflectivity: 0.8 } );

  // Los guardo en un array para luego poder aplicarles el "alambres"
  materialesRobot = [matBase, matEje, matEsparrago, matRotula, matDisco, matNervio, matMano, matPinza];

  // Suelo  
  var geometriaSuelo = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  var suelo = new THREE.Mesh(geometriaSuelo, matSuelo);
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  scene.add(suelo);

  let robot = new THREE.Object3D();
  robot.name = 'robot';

  let materiales = {
    base: matBase,
    eje: matEje,
    esparrago: matEsparrago,
    rotula: matRotula,
    disco: matDisco,
    nervio: matNervio,
    mano: matMano,
    pinza: matPinza
  };

  let base = crearBase(materiales.base);
  let brazo = crearBrazo(materiales);

  brazo.position.y = 35;
  base.add(brazo);
  robot.add(base);
  
  // Asignamos las sombras a cada pieza del robot de forma automatica
  robot.traverse(function(hijo) {
    if (hijo instanceof THREE.Mesh) {
      hijo.castShadow = true;
      hijo.receiveShadow = true;
    }
  });

  scene.add(robot);

  setupLights();
}

function setupLights()
{
  // Iluminacion basica incluida en la plantilla.
  var luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(luzAmbiente);

  var luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
  luzDireccional.position.set(30, 50, 20);
  // Anadido para sombras
  luzDireccional.castShadow = true;
  luzDireccional.shadow.camera.left = -200;
  luzDireccional.shadow.camera.right = 200;
  luzDireccional.shadow.camera.top = 200;
  luzDireccional.shadow.camera.bottom = -200;
  scene.add(luzDireccional);

  // Luz Focal
  var luzFocal = new THREE.SpotLight(0xffffff, 0.7);
  luzFocal.position.set(200, 400, -200);
  luzFocal.target.position.set(0, 100, 0);
  luzFocal.castShadow = true;
  luzFocal.shadow.mapSize.width = 2048;
  luzFocal.shadow.mapSize.height = 2048;
  scene.add(luzFocal);
  scene.add(luzFocal.target); 
}

function crearBase(material)
{
  let base = new THREE.Object3D();
  base.name = 'base';

  let cilindro = new THREE.Mesh(
    new THREE.CylinderGeometry(50, 50, 15, 32),
    material
  );
  cilindro.position.y = 7.5;
  base.add(cilindro);

  return base;
}

function crearBrazo(m)
{
  let brazo = new THREE.Object3D();
  brazo.name = 'brazo';

  let eje = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 20, 18, 32),
    m.eje
  );
  eje.name = 'eje';
  eje.rotation.x = Math.PI / 2;
  brazo.add(eje);

  let esparrago = new THREE.Mesh(
    new THREE.BoxGeometry(18, 120, 12),
    m.esparrago
  );
  esparrago.name = 'esparrago';
  esparrago.position.y = 60;
  brazo.add(esparrago);

  let rotula = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    m.rotula
  );
  rotula.name = 'rotula';
  rotula.position.y = 120;
  brazo.add(rotula);

  let antebrazo = crearAntebrazo(m);
  antebrazo.position.y = 140;
  brazo.add(antebrazo);

  return brazo;
}

function crearAntebrazo(m)
{
  let antebrazo = new THREE.Object3D();
  antebrazo.name = 'antebrazo';

  let disco = new THREE.Mesh(
    new THREE.CylinderGeometry(22, 22, 6, 32),
    m.disco
  );
  disco.name = 'disco';
  disco.position.y = 3;
  antebrazo.add(disco);

  let geometriaNervio = new THREE.BoxGeometry(4, 80, 4);
  let posiciones = [
    [-8, 46, -8],
    [-8, 46, 8],
    [8, 46, -8],
    [8, 46, 8]
  ];

  posiciones.forEach(function(posicion, indice) {
    let nervio = new THREE.Mesh(geometriaNervio, m.nervio);
    nervio.name = 'nervio' + (indice + 1);
    nervio.position.set(posicion[0], posicion[1], posicion[2]);
    antebrazo.add(nervio);
  });

  let mano = crearMano(m);
  mano.position.y = 95;
  antebrazo.add(mano);

  return antebrazo;
}

function crearMano(m)
{
  let mano = new THREE.Object3D();
  mano.name = 'mano';

  let cilindro = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 40, 32),
    m.mano
  );
  cilindro.rotation.z = Math.PI / 2;
  mano.add(cilindro);

  let pinzaIzquierda = crearDedo(m.pinza);
  pinzaIzquierda.name = 'pinzaIzquierda';
  pinzaIzquierda.position.set(-10, 0, 15);
  mano.add(pinzaIzquierda);

  let pinzaDerecha = pinzaIzquierda.clone();
  pinzaDerecha.name = 'pinzaDerecha';
  pinzaDerecha.position.x = 10;
  pinzaDerecha.scale.x = -1;
  mano.add(pinzaDerecha);

  return mano;
}

function crearDedo(matPinza)
{
  let dedo = new THREE.Object3D();

  let soporte = new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 20),
    matPinza
  );
  soporte.position.z = 10;
  dedo.add(soporte);

  let vertices = new Float32Array([
    -2, -2, 20,   2, -2, 20,   2,  2, 20,  -2,  2, 20,
    -1, -1, 39,   1, -1, 39,   1,  1, 39,  -1,  1, 39
  ]);

  let indices = [
    0, 1, 2,  0, 2, 3,
    4, 6, 5,  4, 7, 6,
    0, 4, 5,  0, 5, 1,
    3, 2, 6,  3, 6, 7,
    1, 5, 6,  1, 6, 2,
    0, 3, 7,  0, 7, 4
  ];

  let geometriaCuna = new THREE.BufferGeometry();
  geometriaCuna.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometriaCuna.setIndex(indices);
  geometriaCuna.computeVertexNormals();

  let cuna = new THREE.Mesh(geometriaCuna, matPinza);
  cuna.name = 'cuna';
  dedo.add(cuna);

  return dedo;
}

function setupGUI()
{
  effectController = {
    giroBase: 0.0,
    giroBrazo: 0.0,
    giroAntebrazoY: 0.0,
    giroAntebrazoZ: 0.0,
    giroPinza: 0.0,
    separacionPinza: 10.0, 
    alambres: false,
    animar: function() {
      new TWEEN.Tween(effectController)
        .to({ 
          giroBase: 180, 
          giroBrazo: 45, 
          giroAntebrazoY: 180,
          giroAntebrazoZ: 90,
          giroPinza: 220,
          separacionPinza: 0
        }, 3000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .yoyo(true)
        .repeat(1)
        .start();
    }
  };

  let gui = new lil.GUI();
  let menuRobot = gui.addFolder("Control Robot");
  
  menuRobot.add(effectController, "giroBase", -180.0, 180.0, 1).name("Giro Base").listen();
  menuRobot.add(effectController, "giroBrazo", -45.0, 45.0, 1).name("Giro Brazo").listen();
  menuRobot.add(effectController, "giroAntebrazoY", -180.0, 180.0, 1).name("Giro Antebrazo Y").listen();
  menuRobot.add(effectController, "giroAntebrazoZ", -90.0, 90.0, 1).name("Giro Antebrazo Z").listen();
  menuRobot.add(effectController, "giroPinza", -40.0, 220.0, 1).name("Giro Pinza").listen();
  menuRobot.add(effectController, "separacionPinza", 0.0, 15.0, 1).name("Separacion Pinza").listen();
  
  menuRobot.add(effectController, "alambres").name("alambres").onChange(function(estadoAlambres) {
    for (let i = 0; i < materialesRobot.length; i++) {
      materialesRobot[i].wireframe = estadoAlambres;
    }
  });
  
  menuRobot.add(effectController, "animar").name("Anima");
}


function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update()
{
  cameraControls.update();
  TWEEN.update();

  let robot = scene.getObjectByName('robot');
  let base = scene.getObjectByName('base');
  let brazo = scene.getObjectByName('brazo');
  let antebrazo = scene.getObjectByName('antebrazo');
  let mano = scene.getObjectByName('mano');
  let pinzaIzquierda = scene.getObjectByName('pinzaIzquierda');
  let pinzaDerecha = scene.getObjectByName('pinzaDerecha');
  
  if (base) base.rotation.y = effectController.giroBase * Math.PI / 180;
  if (brazo) brazo.rotation.z = effectController.giroBrazo * Math.PI / 180;
  
  if (antebrazo) {
    antebrazo.rotation.y = effectController.giroAntebrazoY * Math.PI / 180;
    antebrazo.rotation.z = effectController.giroAntebrazoZ * Math.PI / 180;
  }
  
  if (mano) mano.rotation.z = effectController.giroPinza * Math.PI / 180;
  
  if (pinzaIzquierda && pinzaDerecha) {
    pinzaIzquierda.position.x = -effectController.separacionPinza;
    pinzaDerecha.position.x = effectController.separacionPinza;
  }

  // Actualizar la posicion del robot basandonos en el teclado
  if (robot) {
    if (controls.moveForward) robot.position.z -= controls.speed;
    if (controls.moveBackward) robot.position.z += controls.speed;
    if (controls.moveLeft) robot.position.x -= controls.speed;
    if (controls.moveRight) robot.position.x += controls.speed;
  }
}

function render()
{
  requestAnimationFrame(render);
  update();
  
  renderer.clear();

  // VISTA 1: PRINCIPAL
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);

  // VISTA 2: MINIATURA CENITAL
  let dimensionMenor = Math.min(window.innerWidth, window.innerHeight);
  let ladoMiniatura = dimensionMenor / 4;

  renderer.setViewport(0, window.innerHeight - ladoMiniatura, ladoMiniatura, ladoMiniatura);
  renderer.render(scene, cameraMini);
}
