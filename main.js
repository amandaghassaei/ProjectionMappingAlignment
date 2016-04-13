/**
 * Created by ghassaei on 4/13/16.
 */

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

    var container, stats;
    var camera, scene, renderer;
    var mouseX = 0, mouseY = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    window.onload = init;
    function init() {
        container = document.getElementById('three');
        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
        camera.position.z = 250;
        // scene
        scene = new THREE.Scene();
        var ambient = new THREE.AmbientLight( 0x444444 );
        scene.add( ambient );
        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 0, 0, 1 ).normalize();
        scene.add( directionalLight );
        //
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        //
        window.addEventListener( 'resize', onWindowResize, false );

        //events
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

        animate();
    }


    //handle files
    var objURL;
    var materials;

    function handleFileSelectMaterials(evt) {
        var files = evt.target.files; // FileList object
        if (files.length < 1) {
            console.warn("no files");
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


    function loadMaterial(url, ddsURLs){
        THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setBaseUrl( '' );
		mtlLoader.setPath( '' );
        mtlLoader.load(url, function(_materials) {
            var _materialsKeys = Object.keys(_materials.materialsInfo);
            for (var i=0;i<_materialsKeys.length;i++){
                //change map_kd to data url
                _materials.materialsInfo[_materialsKeys[i]].map_kd = ddsURLs[_materials.materialsInfo[_materialsKeys[i]].map_kd];
            }
            console.log(_materials.materialsInfo);
            _materials.preload();
            materials = _materials;
            loadOBJ();//reload obj with new materisl
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
            object.position.y = - 95;
            scene.add( object );
        }, onProgress, onError );
    }






    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    function onDocumentMouseMove( event ) {
        mouseX = ( event.clientX - windowHalfX ) / 2;
        mouseY = ( event.clientY - windowHalfY ) / 2;
    }
    //
    function animate() {
        requestAnimationFrame( animate );
        render();
    }
    function render() {
        camera.position.x += ( mouseX - camera.position.x ) * .05;
        camera.position.y += ( - mouseY - camera.position.y ) * .05;
        camera.lookAt( scene.position );
        renderer.render( scene, camera );
    }