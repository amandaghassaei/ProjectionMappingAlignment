/**
 * Created by ghassaei on 9/27/16.
 */

var brightness = 255;
var opacity = 1;
var rotation = 0;
var geoOffset = new THREE.Vector3(0,0,0);
var scale = 1;

var perspecitveFOV = 20;
var perspectiveZoom = 1;

var orthoFOV = 20;
var orthoZoom = 1;

var isPerspective = true;

var cameraPosition = new THREE.Vector3(0,0,300);
var lookAt = new THREE.Vector3(0,0,0);

function initControls(ambientLight){

    setSliderInput("#brightness", brightness, 0, 255, 1, function(val){
        brightness = val;
        ambientLight.color.setRGB(brightness/255, brightness/255, brightness/255);
        render();
    });
    setSliderInput("#opacity", opacity, 0, 1, 0.01, function(val){
        opacity = val;
        if (mesh) {
            mesh.children[0].material.opacity = val;
        }
        render();
    });

    setSliderInput("#rotation", rotation, 0, Math.PI*2, 0.01, function(val){
        rotation = val;
        if (mesh) mesh.rotation.set(0,rotation,0);
        render();
    });
    setInput("#rotationX", geoOffset.x, function(val){
        geoOffset.x = val;
        if (mesh) mesh.children[0].position.x = val;
        render();
    });
    setInput("#rotationZ", geoOffset.z, function(val){
        geoOffset.z = val;
        if (mesh) mesh.children[0].position.z = val;
        render();
    });

    setSliderInput("#scale", scale, 0.0001, 1, 0.01, function(val){
        scale = val;
        if (mesh) mesh.scale.set(scale,scale,scale);
        render();
    });

    //camera controls
    setSliderInput("#fovPerspective", perspecitveFOV, 1, 180, 0.01, function(val){
        perspecitveFOV = val;
        perspectiveCamera.fov = val;
        perspectiveCamera.updateProjectionMatrix();
        render();
    });

    setSliderInput("#zoomPerspective", perspectiveZoom, 0.001, 20, 0.01, function(val){
        perspectiveZoom = val;
        perspectiveCamera.zoom = val;
        perspectiveCamera.updateProjectionMatrix();
        render();
    });


    setSliderInput("#fovOrtho", orthoFOV, 1, 180, 0.01, function(val){
        orthoFOV = val;
        render();
    });

    setSliderInput("#zoomOrtho", orthoZoom, 0.001, 20, 0.01, function(val){
        orthoZoom = val;
        render();
    });

    if (isPerspective) $("input:radio[value=perspective]").prop('checked', true);
    else $("input:radio[value=ortho]").prop('checked', true);
    changeCamera();

    $("input:radio").change(function(){
        isPerspective = $("input:radio[value=perspective]").prop('checked');
        changeCamera();
        render();
    });

    perspectiveCamera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    setInput("#cameraX", cameraPosition.x, function(val){
        cameraPosition.x = val;
        perspectiveCamera.position.x = val;
        render();
    });
    setInput("#cameraY", cameraPosition.y, function(val){
        cameraPosition.y = val;
        perspectiveCamera.position.y = val;
        render();
    });
    setInput("#cameraZ", cameraPosition.z, function(val){
        cameraPosition.z = val;
        perspectiveCamera.position.z = val;
        render();
    });

    perspectiveCamera.lookAt(lookAt);
    setInput("#lookAtX", lookAt.x, function(val){
        lookAt.x = val;
        perspectiveCamera.lookAt(lookAt);
        render();
    });
    setInput("#lookAtY", lookAt.y, function(val){
        lookAt.y = val;
        perspectiveCamera.lookAt(lookAt);
        render();
    });
    setInput("#lookAtZ", lookAt.z, function(val){
        lookAt.z = val;
        perspectiveCamera.lookAt(lookAt);
        render();
    });

}

function changeCamera(){
    if (isPerspective){
        $("#orthoControls").css("opacity","0.4");
        $("#perspectiveControls").css("opacity","1");
    } else {
        $("#perspectiveControls").css("opacity","0.4");
        $("#orthoControls").css("opacity","1");
    }
}

function setSliderInput(el, val, min, max, step, callback){
    var slider = $(el+">.flat-slider").slider({
        orientation: 'horizontal',
        range: false,
        value: val,
        min: min,
        max: max,
        step: step
    });
    var $input = $(el+">input");
    $input.val(val);
    slider.on("slide", function(){
        var val  = slider.slider('value');
        callback(val);
        $input.val(val);
    });
    $input.change(function(){
        var val = $input.val();
        if (isNaN(val)){
            console.warn("val in NaN");
            return;
        }
        slider.slider('value', val);
        callback(val);
    });
}

function setInput(el, val, callback){
    var $input = $(el+">input");
    $input.val(val);
    $input.change(function(){
        var val = $input.val();
        if (isNaN(val)){
            console.warn("val in NaN");
            return;
        }
        callback(val);
    });
}
