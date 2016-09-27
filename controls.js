/**
 * Created by ghassaei on 9/27/16.
 */

var brightness = 255;

function initControls(ambientLight){

    var brightnessSlider = $("#brightness").slider({
        orientation: 'horizontal',
        range: false,
        value: brightness,
        min: 0,
        max: 255,
        step: 1
    });
    brightnessSlider.on("slide", function(){
        brightness = brightnessSlider.slider('value');
        ambientLight.color.setRGB(brightness/255, brightness/255, brightness/255);
        render();
    });

    //var intensitySlider = $("#intensity").slider({
    //    orientation: 'horizontal',
    //    range: false,
    //    value: intensity,
    //    min: 0,
    //    max: 1,
    //    step: 0.01
    //});
    //intensitySlider.on("slide", function(){
    //    intensity = intensitySlider.slider('value');
    //    ambientLight.intensity = intensity;
    //    render();
    //});




}
