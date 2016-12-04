/**
 * Created by amandaghassaei on 12/3/16.
 */


function initOptimizer(fitness){

    var initialFitness;
    var running = false;

    var originVis, crosshairVis;

    function optimize(params){

        webcam.pause();

        if (!mesh) return;
        mesh.visible = false;
        originVis = origin.visible;
        origin.visible = false;
        crosshairVis = $("#crosshairs").is(":visible");
        $("#crosshairs").hide();

        // $("#controls").hide();
        $("#cameraControls").hide();
        $("#warning").hide();

        running = true;

        sliderInputs['#outlineOffset'](0);//start at zero

        initialFitness = -1;
        window.requestAnimationFrame(function(){
            getInitialFitness(function(){
                if (initialFitness == -1) {
                    showWarn("bad initial fitness");
                    console.warn("bad initial fitness");
                    pause();
                    return;
                }
                console.log(initialFitness);
                pause();
            }, 0);
        });
    }

    function getInitialFitness(callback, phase){
        if (!running) return;
        if (phase < 1){//render
            webcam.getFrame();
            render();
            window.requestAnimationFrame(function(){
                getInitialFitness(callback, phase+1);
            });
        } else {
            initialFitness = fitness.calcFitness();
            showWarn(initialFitness);
            if (initialFitness < 0) {
                var nextOutlineOffset = fitness.getOutlineOffset() + 1;
                if (nextOutlineOffset > 80){
                    callback();
                    return;
                }
                sliderInputs['#outlineOffset'](nextOutlineOffset);
                window.requestAnimationFrame(function(){
                    getInitialFitness(callback, 0);
                });
            }
            else callback();
        }
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
        var $target = $(e.target);
        var id = $target.parent().data("id");
        var params = [];
        if (id == "camera"){
            params.push("cameraX");
            params.push("cameraY");
            params.push("cameraZ");
        } else if (id == "lookAt"){
            params.push("lookAtX");
            params.push("lookAtY");
        } else if (id == "rotationZero"){
            params.push("rotationZero");
        } else {
            showWarn("unknown optimization parameter " + id);
            console.warn("unknown optimization parameter " + id);
        }
        optimize(params);
    });

    return {
        pause: pause,
        isRunning: isRunning
    }
}