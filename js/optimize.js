/**
 * Created by amandaghassaei on 12/3/16.
 */


function initOptimizer(fitness){

    var running = false;
    var solutions = [-1, -1, -1, -1];
    var angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];

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
        window.requestAnimationFrame(function(){
            evaluate(function(initialFitness, initialOffset){
                if (initialFitness == -1) {
                    showWarn("bad initial fitness");
                    console.warn("bad initial fitness");
                    pause();
                    return;
                }
                resetSolver();
                gradient(params, initialFitness, initialOffset, 0.2);
            }, 0);
        });
    }

    function resetSolver(){
        solutions = [-1, -1, -1, -1];
    }

    function moveParams(allFitnesses, stepSize){
        console.log(allFitnesses);
        pause();
    }

    function gradient(params, bestFitness, bestOffset, stepSize){
        // for (var i=0;i<angles.length;i++){
            //todo rotate to angle

        console.log(bestOffset);
        console.log(bestFitness);

        var allFitnesses = [];

        for (var j=0;j<params.length;j++){
            allFitnesses.push([]);
        }
        var j = 0;
        var k = 0;

        _gradient(params, j, k, stepSize, allFitnesses, [bestFitness, bestOffset]);


        // }
    }

    function _gradient(params, j, k, stepSize, allFitnesses, bestStats){
        var key = "#" + params[j];
        var current = currentValues[key];
        var nextVal = current + stepSize;
        if (k == 1) nextVal = current - stepSize;
        sliderInputs[key](nextVal);
        sliderInputs['#outlineOffset'](0);//start at zero offset
        window.requestAnimationFrame(function() {
            evaluate(function (newFitness, newOffset) {
                sliderInputs[key](current);//reset back to original
                allFitnesses[j].push([newFitness, newOffset]);
                if (k==0 && !isBetter([newFitness, newOffset], bestStats)) {
                    _gradient(params, j, 1, stepSize, allFitnesses, bestStats);
                } else if (j<params.length-1) _gradient(params, j+1, 0, stepSize, allFitnesses, bestStats);
                else moveParams(allFitnesses, stepSize);
            }, 0);
        });
    }

    function isBetter(newData, oldData){
        if (newData[1] < oldData[1]) return true;//offset
        if (newData[1] == oldData[1]){
            if (newData[0] > oldData[0]) return true;//num pixels
        }
        return false;
    }

    function evaluate(callback, phase){
        if (!running) return;
        if (phase < 1){//render
            render();
            webcam.getFrame();
            setTimeout(function(){//waste time to make sure we get next webcam frame
                window.requestAnimationFrame(function(){
                    evaluate(callback, phase+1);
                });
            }, 500);
        } else {
            var _fitness = fitness.calcFitness();
            var currentOffset = fitness.getOutlineOffset();
            showWarn("offset: " + currentOffset + ", fitness:" + _fitness);
            if (_fitness < 0) {
                var nextOutlineOffset = currentOffset + 1;
                if (nextOutlineOffset > 80){
                    callback(_fitness, currentOffset);
                    return;
                }
                sliderInputs['#outlineOffset'](nextOutlineOffset);
                window.requestAnimationFrame(function(){
                    evaluate(callback, 0);
                });
            }
            else callback(_fitness, currentOffset);
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