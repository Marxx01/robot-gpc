# Práctica 5: Luces y Materiales

Para ver el resultado final, abre [index.html](./index.html) (es la antigua `practica5.html`; GitHub Pages abre siempre `index.html`). Todo el código está dentro de [js/practica5.js](./js/practica5.js).

Para esta práctica he reciclado bastantes cosas de los archivos de ejemplo que nos dio el profesor (como `tron-base-seminario4.js`, `test.js` y `heightmap.js`) para ahorrar tiempo, ir a lo seguro y no partir desde cero.

## Mejoras implementadas

### 1. Luces y Sombras
He copiado la inicialización de la iluminación de la plantilla de Tron (`tron-base-seminario4.js`), que ya venía con una `AmbientLight` y una `DirectionalLight`. Solo he tenido que añadirles `castShadow = true`, agrandar la cámara de sombras de la direccional para que cubra todo el robot, y añadirle un foco nuevo (`SpotLight`) que apunte directo al centro de la escena.

Para que las sombras se vean, activé `renderer.shadowMap.enabled = true` y utilicé un `.traverse` sobre todo el objeto del robot. Así se le pone `castShadow` y `receiveShadow` a todas las piececitas del tirón sin escribirlo una por una.

### 2. Control de teclado
En la práctica 4 tenía un control muy básico, pero he visto que en `heightmap.js` hay un objeto `controls` y unos Event Listeners súper completos que leen tanto las flechas direccionales como el WASD. He copiado ese bloque entero en mi código, y en mi función `update()` simplemente resto o sumo a la `robot.position` si se pulsa hacia adelante, atrás, izquierda o derecha.

### 3. Texturas y Materiales
He cogido la estructura de definir materiales del archivo `test.js`. Todas las texturas usadas están en la carpeta `images/` de serie, no he bajado nada externo:
- **Suelo**: Tiene la textura `pisometalico_1024.jpg` mapeada en un `MeshLambertMaterial` y con `side: THREE.DoubleSide` como se veía en el suelo del seminario 4.
- **Piezas Mate**: La base, los nervios y las pinzas usan `wood512.jpg` (madera) en un `MeshLambertMaterial`.
- **Piezas Brillantes**: El eje, el disco y la mano usan `metal_128.jpg` (metal brillante) en un `MeshPhongMaterial`.
- **Rótula (entorno)**: Usa un `CubeTextureLoader` con las 6 texturas y se pasa directo a la propiedad `envMap` de un `MeshPhongMaterial` para que refleje toda la habitación.

### 4. Habitación (Skybox)
Para la habitación, he creado un cubo grande, y como son 6 materiales, directamente le he metido 6 `.push()` seguidos al array de materiales con cada textura (como haría cualquiera para no complicarse con bucles raros). El truco importante era el `side: THREE.BackSide` en el material básico para que pinte la imagen por dentro de la caja.

### 5. Modo Alámbrico
Como ahora los materiales están sueltos en distintas variables, he creado un array llamado `materialesRobot` donde los guardo todos. Así, cuando marcas el checkbox de "alambres" del panel, un bucle `for` los recorre y les cambia la propiedad `wireframe` de golpe.
