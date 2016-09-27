/**
 * Created by ghassaei on 4/13/16.
 */

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

    var container;
    var camera, scene, renderer, controls;
    window.onload = init;

    function init() {
        container = document.getElementById('three');


        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 6000 );
        //camera = new THREE.OrthographicCamera(window.innerWidth/-2, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 0.1, 1000);
        camera.position.z = 250;


        // scene
        scene = new THREE.Scene();
        var ambient = new THREE.AmbientLight( 0x444444 );
        scene.add( ambient );
        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 0, 0, 1 ).normalize();
        scene.add( directionalLight );

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );

        controls = new THREE.OrbitControls(camera, container);
        controls.addEventListener('change', render);


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

        render();
    }


    //handle files
    var objURL;
    var mesh;
    var materials;//load from mtl
    var texture;//load from img

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
                child.material.map = texture;
                child.material.needsUpdate = true;
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
            if (mesh) scene.remove(mesh);//remove old mesh from scene
            mesh = object;//save to global scope
            updateIMGTexture();
            object.position.y = - 95;
            scene.add( object );
            render();
        }, onProgress, onError );
    }




    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        //camera.left = -window.innerWidth / 2;
        //camera.right = window.innerWidth / 2;
        //camera.top = window.innerHeight / 2;
        //camera.bottom = -window.innerHeight / 2;
        //camera.updateProjectionMatrix();
        render();
    }

    function render() {
        renderer.render( scene, camera );
    }