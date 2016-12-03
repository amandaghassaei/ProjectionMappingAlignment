/**
 * Created by ghassaei on 9/27/16.
 */

var brightness = 255;
var opacity = 1;
var rotation = 1;
var rotationZero = 0;
var geoOffset = new THREE.Vector3(-0.462,0,-0.18);
var scale = 1;

var perspecitveFOV = 20.43;
var perspectiveZoom = 1;

var orthoFOV = 20;
var orthoZoom = 1;

var isPerspective = true;

var cameraPosition = new THREE.Vector3(0,140,790);
var lookAt = new THREE.Vector3(-19.1,115.79,0);

var sliderInputs = [];

function initControls(ambientLight){

    window.addEventListener("keyup", function(e){
        // console.log(e.keyCode);
        if (e.keyCode == 72){//h
            if (optimizer.isRunning()) optimizer.pause();
            if ($("#controls").is(":visible")) {
                $("#controls").fadeOut();
                $("#cameraControls").fadeOut();
            }
            else {
                $("#controls").fadeIn();
                $("#cameraControls").fadeIn();
            }
        } else if (e.keyCode == 70){
            toggleFullScreen();
        }
    }, true);

    function toggleFullScreen() {
      if ((document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method
          (!document.mozFullScreen && !document.webkitIsFullScreen)) {               // current working methods
        if (document.documentElement.requestFullScreen) {
          document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
          document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      } else {
        if (document.cancelFullScreen) {
          document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
      }
    }

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


    $("#rotationZero").html(rotationZero);
    $("#setZero").click(function(e){
        e.preventDefault();
        rotationZero = rotation;
        $("#rotationZero").html(rotationZero);
    });
    socket.on("dataIn", function(data){
        var json = JSON.parse(data);
        if (json.sr && json.sr.posx){
            mesh.rotation.set(0,json.sr.posx,0);
        }
    });
    setSliderInput("#rotation", rotation, 0, 2*Math.PI, 0.01, function(val){
        rotation = val;
        if (mesh) {
            // mesh.rotation.set(0,rotation,0);
            socket.emit('rotation', "g0 x" + rotation);
        }
        render();
    });

    setSliderInput("#rotationX", geoOffset.x, -1, 1, 0.01, function(val){
        geoOffset.x = val;
        if (mesh) {
            var scalingFactor = 0.09;
            mesh.children[0].position.x = mesh.children[0].geometry.boundingBox.max.x*scalingFactor*val;
        }
        render();
    });

    setSliderInput("#rotationZ", geoOffset.z, -1, 1, 0.01, function(val){
        geoOffset.z = val;
        if (mesh) {
            var scalingFactor = 0.09;
            mesh.children[0].position.z = mesh.children[0].geometry.boundingBox.max.z*scalingFactor*val;
        }
        render();
    });

    setLogSliderInput("#scale", scale, 0.0001, 10, 0.01, function(val){
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
        orthoCamera.fov = val;
        orthoCamera.updateProjectionMatrix();
        render();
    });

    setSliderInput("#zoomOrtho", orthoZoom, 0.001, 20, 0.01, function(val){
        orthoZoom = val;
        orthoCamera.zoom = val;
        orthoCamera.updateProjectionMatrix();
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
    orthoCamera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    setSliderInput("#cameraX", cameraPosition.x, -100, 100, 0.01, function(val){
        cameraPosition.x = val;
        perspectiveCamera.position.x = val;
        orthoCamera.position.x = val;
        perspectiveCamera.lookAt(lookAt);
        orthoCamera.lookAt(lookAt);
        render();
    });
    setSliderInput("#cameraY", cameraPosition.y, -300, 300, 0.01, function(val){
        cameraPosition.y = val;
        perspectiveCamera.position.y = val;
        orthoCamera.position.y = val;
        perspectiveCamera.lookAt(lookAt);
        orthoCamera.lookAt(lookAt);
        render();
    });
    setSliderInput("#cameraZ", cameraPosition.z, 0, 1000, 0.01, function(val){
        cameraPosition.z = val;
        perspectiveCamera.position.z = val;
        orthoCamera.position.z = val;
        perspectiveCamera.lookAt(lookAt);
        orthoCamera.lookAt(lookAt);
        render();
    });

    perspectiveCamera.lookAt(lookAt);
    orthoCamera.lookAt(lookAt);
    setSliderInput("#lookAtX", lookAt.x, -20, 20, 0.01, function(val){
        lookAt.x = val;
        perspectiveCamera.lookAt(lookAt);
        orthoCamera.lookAt(lookAt);
        render();
    });
    setSliderInput("#lookAtY", lookAt.y, -10, 300, 0.01, function(val){
        lookAt.y = val;
        perspectiveCamera.lookAt(lookAt);
        orthoCamera.lookAt(lookAt);
        render();
    });
    setInput("#lookAtZ", lookAt.z, function(val){
        lookAt.z = val;
        perspectiveCamera.lookAt(lookAt);
        orthoCamera.lookAt(lookAt);
        render();
    });


    $('#showCrosshairs').prop('checked', true);
    $('#showCrosshairs').change(function() {
        var $crosshairs = $("#crosshairs");
        if (this.checked) $crosshairs.show();
        else $crosshairs.hide();
    });

    $('#showGeoOrigin').prop('checked', true);
    $('#showGeoOrigin').change(function() {
        origin.visible = this.checked;
        render();
    });

}

function showWarn(text){
    $("#warning>div").html(text);
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

function setLogSliderInput(id, val, min, max, incr, callback){

    var _scale = (Math.log(max)-Math.log(min)) / (max-min);

    var slider = $(id+">div").slider({
        orientation: 'horizontal',
        range: false,
        value: (Math.log(val)-Math.log(min)) / _scale + min,
        min: min,
        max: max,
        step: incr
    });

    var $input = $(id+">input");
    $input.change(function(){
        var val = $input.val();
        if ($input.hasClass("int")){
            if (isNaN(parseInt(val))) return;
            val = parseInt(val);
        } else {
            if (isNaN(parseFloat(val))) return;
            val = parseFloat(val);
        }

        var min = slider.slider("option", "min");
        if (val < min) val = min;
        if (val > max) val = max;
        $input.val(val);
        slider.slider('value', (Math.log(val)-Math.log(min)) / _scale + min);
        callback(val, id);
    });
    $input.val(val);
    slider.on("slide", function(e, ui){
        var val = ui.value;
        val = Math.exp(Math.log(min) + _scale*(val-min));
        $input.val(val.toFixed(4));
        callback(val, id);
    });
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
    sliderInputs[el] = function(_manualVal){
        $input.val(_manualVal);
        slider.slider('value', _manualVal);
        callback(_manualVal);
    };
    $input.val(val);
    slider.on("slide", function(){
        var val  = slider.slider('value');
        callback(val);
        $input.val(val);
    });
    $input.change(function(){
        var val = $input.val();
        if (isNaN(val)){
            showWarn("val is NaN");
            console.warn("val is NaN");
            return;
        }
        slider.slider('value', val);
        callback(val);
    });
    return slider;
}

function setSliderStopInput(el, val, min, max, step, callback){
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
    slider.on("slidestop", function(){
        var val  = slider.slider('value');
        callback(val);
        $input.val(val);
    });
    $input.change(function(){
        var val = $input.val();
        if (isNaN(val)){
            showWarn("val is NaN");
            console.warn("val is NaN");
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
        var val = parseFloat($input.val());
        if (isNaN(val)){
            showWarn("val is NaN");
            console.warn("val is NaN");
            return;
        }
        callback(val);
    });
}
