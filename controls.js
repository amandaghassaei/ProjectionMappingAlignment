/**
 * Created by ghassaei on 9/27/16.
 */

var brightness = 255;
var rotation = 0;

function initControls(ambientLight){

    setSliderInput("#brightness", brightness, 0, 255, 1, function(val){
        brightness = val;
        ambientLight.color.setRGB(brightness/255, brightness/255, brightness/255);
        render();
    });

    setSliderInput("#rotation", rotation, 0, Math.PI*2, 0.01, function(val){
        rotation = val;
        if (mesh) mesh.rotation.set(0,rotation,0);
        render();
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
