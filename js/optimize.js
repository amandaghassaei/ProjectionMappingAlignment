/**
 * Created by amandaghassaei on 12/3/16.
 */


function initOptimizer(fitness){

    var initialFitness;
    var running = false;

    var originVis, crosshairVis;

    function optimize(param, callback){

        webcam.pause();

        if (!mesh) return;
        mesh.visible = false;
        originVis = origin.visible;
        origin.visible = false;
        crosshairVis = $("#crosshairs").is(":visible");
        $("#crosshairs").hide();
        render();

        // $("#controls").hide();
        $("#cameraControls").hide();
        $("#warning").hide();

        running = true;

        //wait for render();


        initialFitness = fitness.calcFitness();
        if (initialFitness == -1) {
            showWarn("bad initial fitness");
            console.warn("bad initial fitness");
            pause();
            return;
        }
        sliderInputs['#outlineOffset'](50);
        // sliderInputs['#outlineWidth'](10);


    }

    function pause(){
        running = false;
        webcam.start();
        $("#controls").show();
        $("#cameraControls").show();
        if (mesh) mesh.visible = true;
        origin.visible = originVis;
        if (crosshairVis) $("#crosshairs").show();
        render();
    }

    function isRunning(){
        return running;
    }


    $(".optimize").click(function(e){
        e.preventDefault();
        optimize();
    });

    return {
        pause: pause,
        isRunning: isRunning
    }
}