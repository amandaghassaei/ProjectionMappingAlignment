/**
 * Created by ghassaei on 4/13/16.
 */

var container, perspectiveCamera, orthoCamera, scene, outlineScene1, outlineScene2, renderer, orthoControls, perspectiveControls;

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

window.onload = init;

//handle files
var objURL;
var mesh;
var materials;//load from mtl
var texture;//load from img

var socket;

var origin = new THREE.Mesh(new THREE.SphereGeometry(10), new THREE.MeshBasicMaterial({color:0x00ff00}));
var fitness;
var optimizer;
var webcam;

function init() {
    container = document.getElementById('three');


    perspectiveCamera = new THREE.PerspectiveCamera( perspecitveFOV, window.innerWidth / window.innerHeight, 0.1, 6000 );
    perspectiveCamera.zoom = perspectiveZoom;

    orthoCamera = new THREE.OrthographicCamera(window.innerWidth/-2, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 0.1, 6000);
    orthoCamera.zoom = orthoCamera;

    // scene
    scene = new THREE.Scene();
    outlineScene1 = new THREE.Scene();
    outlineScene2 = new THREE.Scene();
    var ambient = new THREE.AmbientLight(0xffffff);
    ambient.intensity = 1;
    scene.add( ambient );
    scene.add(origin);
    //var directionalLight = new THREE.DirectionalLight( 0xffeedd );
    //directionalLight.position.set( 0, 0, 1 ).normalize();
    //scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.autoClear = false;
    container.appendChild( renderer.domElement );

    //perspectiveControls = new THREE.OrbitControls(perspectiveCamera, container);
    //perspectiveControls.addEventListener('change', render);
    //orthoControls = new THREE.OrbitControls(orthoCamera, container);
    //orthoControls.addEventListener('change', render);

    window.addEventListener( 'resize', onWindowResize, false );

    //events for loading files
    document.getElementById('files').addEventListener('change', handleFileSelectMaterials, false);
    document.getElementById('file').addEventListener('change', handleFileSelectOBJ, false);
    document.getElementById('loadOBJ').addEventListener('click', function(e){
        e.preventDefault();
        document.getElementById('file').click();
    });
    document.getElementById('loadMTL').addEventListener('click', function(e){
        e.preventDefault();
        document.getElementById('files').click();
    });

    socket = io('http://localhost:8080', {'forceNew':true});
    socket.on('connect', function(data){
        console.log("connected");
    });

    initControls(ambient, mesh);
    webcam = initWebcam();
    fitness = initFitness();
    optimizer = initOptimizer(fitness);

    //render();
}

function handleFileSelectMaterials(evt) {
    var files = evt.target.files; // FileList object
    if (files.length < 1) {
        console.warn("no files");
        return;
    }

    if (files.length == 1 && files[0].type.match('image.*')){
        //load image as texture
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function(){
            return function(e) {
                loadImage(e.target.result);
            }
        }(file);
        reader.readAsDataURL(file);
        return;
    }

    var mtlFile = findMTLFile(files);
    if (!mtlFile) return;

    var ddsFiles = findDDSFiles(files);
    if (ddsFiles.length == 0) loadMTL();
    for (var i=0;i<ddsFiles.length;i++){
        var file = ddsFiles[i];
        var reader = new FileReader();
        reader.onload = function(_file){
            return function(e) {
                saveDDSURLs(e.target.result, _file.name);
            }
        }(file);
        reader.readAsDataURL(file);
    }

    var ddsURLS = {};
    function saveDDSURLs(url, name){
        ddsURLS[name] = url;
        if (Object.keys(ddsURLS).length >= ddsFiles.length){
            loadMTL();
        }
    }

    function loadMTL(){
        var reader = new FileReader();
        reader.onload = function(){
            return function(e) {
                loadMaterial(e.target.result, ddsURLS);
            }
        }(mtlFile);
        reader.readAsDataURL(mtlFile);
    }
}
function findMTLFile(files){
    for (var i=0;i<files.length;i++){
        var file = files[i];
        if (getExtension(file.name) == "mtl"){
            return file;
        }
    }
    console.warn("no mtl found");
    return null;
}
function findDDSFiles(files){
    var ddsFiles = [];
    for (var i=0;i<files.length;i++){
        var file = files[i];
        if (getExtension(file.name) == "dds") ddsFiles.push(file);
    }
    if (ddsFiles.length == 0) console.warn("no dds files");
    return ddsFiles;
}


function handleFileSelectOBJ(evt) {
    var files = evt.target.files; // FileList object
    if (files.length < 1) {
        console.warn("no files");
        return;
    }
    var file = files[0];
    var reader = new FileReader();
    if (getExtension(file.name) == "obj"){
        reader.onload = function(){
            return function(e) {
                loadOBJ(e.target.result);
            }
        }(file);
    } else {
        console.warn("invalid extension " + getExtension(file.name));
    }
    reader.readAsDataURL(file);
}
function getExtension(name){
    var split = name.split('.');
    if (split.length < 2) {
        console.warn("no file extension");
        return;
    }
    return split[1];
}


function loadImage(url){
    var manager = new THREE.LoadingManager();
    var loader = new THREE.ImageLoader( manager );
    loader.load(url, function ( image ) {
        texture = new THREE.Texture();
        texture.image = image;
        texture.needsUpdate = true;
        materials = null;//remove any previously loaded mtl
        //apply to previously loaded mesh
        updateIMGTexture();
    });
}
function updateIMGTexture(){
    if (mesh && texture) mesh.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
            child.material.transparent = true;
            child.material.map = texture;
            child.material.needsUpdate = true;
            render();
        }
    });
}


function loadMaterial(url, ddsURLs){
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setBaseUrl( '' );
    mtlLoader.setPath( '' );
    mtlLoader.load(url, function(_materials) {
        var _materialsKeys = Object.keys(_materials.materialsInfo);
        for (var i=0;i<_materialsKeys.length;i++){
            //change map_kd to data url
            _materials.materialsInfo[_materialsKeys[i]].map_kd = ddsURLs[_materials.materialsInfo[_materialsKeys[i]].map_kd];
        }
        _materials.preload();
        materials = _materials;
        texture = null;//remove any previously loaded img texture
        loadOBJ();//reload obj with new material
    });
}

function loadOBJ(url){
    url = url || objURL;
    if (!url) return;
    objURL = url;//save to global scope
    var objLoader = new THREE.OBJLoader();

    //add these if you want
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    var onError = function ( xhr ) { };

    if (materials) objLoader.setMaterials(materials);
    objLoader.load(url, function ( object ) {
        if (mesh) {
            scene.remove(mesh);
        }//remove old mesh from scene
        mesh = object;//save to global scope

        //var center = mesh.children[0].geometry.boundingBox.max.clone().add(mesh.children[0].geometry.boundingBox.min).multiplyScalar(0.5);
        //mesh.children[0].position.set(-center.x, -center.y, -center.z);
        mesh.children[0].geometry.center();
        mesh.children[0].geometry.computeBoundingBox();

        //var size = mesh.children[0].geometry.boundingBox.max.clone().sub(mesh.children[0].geometry.boundingBox.min);
        //var scalingFactor = size.x;
        //if (size.y>scalingFactor) scalingFactor = size.y;
        //if (size.z>scalingFactor) scalingFactor = size.z;
        //scalingFactor = 1/scalingFactor;
        var scalingFactor = 0.09;
        mesh.children[0].scale.set(scalingFactor, scalingFactor, scalingFactor);

        //put origin in screwhole
        mesh.children[0].position.y = mesh.children[0].geometry.boundingBox.max.y*scalingFactor;
        mesh.children[0].position.x = mesh.children[0].geometry.boundingBox.max.x*scalingFactor*geoOffset.x;
        mesh.children[0].position.z = mesh.children[0].geometry.boundingBox.max.z*scalingFactor*geoOffset.z;

        mesh.position.set(0,0,0);
        mesh.rotation.set(0,rotation*Math.PI/180,0);

        fitness.setMesh(mesh);

        updateIMGTexture();
        scene.add( object );
        render();
    }, onProgress, onError );
}




function onWindowResize() {
    perspectiveCamera.aspect = window.innerWidth / window.innerHeight;
    orthoCamera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize( window.innerWidth, window.innerHeight );
    orthoCamera.left = -window.innerWidth / 2;
    orthoCamera.right = window.innerWidth / 2;
    orthoCamera.top = window.innerHeight / 2;
    orthoCamera.bottom = -window.innerHeight / 2;
    perspectiveCamera.updateProjectionMatrix();
    orthoCamera.updateProjectionMatrix();
    render();
}

function render() {
    fitness.sync();
    renderer.clear();
    _render(outlineScene1);
    renderer.clearDepth();
    _render(outlineScene2);
    renderer.clearDepth();
    _render(scene);
}

function _render(_scene){
    if (isPerspective) renderer.render(_scene, perspectiveCamera);
    else renderer.render(_scene, orthoCamera );
}