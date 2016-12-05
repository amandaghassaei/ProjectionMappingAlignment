/**
 * Created by amandaghassaei on 12/3/16.
 */


function initOptimizer(fitness){

    var running = false;
    var angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];

    var rotationZeroTol = 0.1;
    setInput("#rotationZeroTol", rotationZeroTol, function(val){
        rotationZeroTol = val;
    });
    var cameraTol = 1;
    setInput("#cameraTol", cameraTol, function(val){
        cameraTol = val;
    });
    var lookatTol = 1;
    setInput("#lookAtTol", lookatTol, function(val){
        lookatTol = val;
    });


    var originVis, crosshairVis;

    function optimize(params, stepSize){

        webcam.pause();

        if (!mesh) {
            showWarn("upload a mesh before starting optimization");
            return;
        }
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
                gradient(params, initialFitness, initialOffset, stepSize);
            }, 0);
        });
    }

    function moveParams(params, allFitnesses, bestStats, stepSize){

        var vector = [];
        for (var i=0;i<params.length;i++){
            var paramData = allFitnesses[i];
            var bestParamData = paramData[paramData.length-1];
            if (isBetter(bestParamData, bestStats)){
                if (paramData.length == 1) vector.push(1);
                else vector.push(-1);
            } else {
                vector.push(0);
            }
        }
        var vectorLength = 0;
        for (var i=0;i<vector.length;i++){
            vectorLength += vector[i]*vector[i];
        }
        vectorLength = Math.sqrt(vectorLength);

        console.log(vector);
        if (vectorLength == 0){
            //opt found
            pause();
            return;
        }

        //normalize to step size and set vars
        for (var i=0;i<vector.length;i++){
            vector[i] *= stepSize/vectorLength;
            var key = "#" + params[i];
            sliderInputs[key](currentValues[key] + vector[i]);
        }
        sliderInputs['#outlineOffset'](0);

        window.requestAnimationFrame(function() {
            evaluate(function (newFitness, newOffset) {
                gradient(params, newFitness, newOffset, stepSize);
            }, 0);
        });
    }

    function gradient(params, bestFitness, bestOffset, stepSize){
        // for (var i=0;i<angles.length;i++){
            //todo rotate to angle

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
        var nextOffset = bestStats[1]-1;
        if (nextOffset<0) nextOffset = 0;
        sliderInputs['#outlineOffset'](nextOffset);//start at one offset less than current best
        window.requestAnimationFrame(function() {
            evaluate(function (newFitness, newOffset) {
                sliderInputs[key](current);//reset back to original
                allFitnesses[j].push([newFitness, newOffset]);
                if (k==0 && !isBetter([newFitness, newOffset], bestStats)) {
                    _gradient(params, j, 1, stepSize, allFitnesses, bestStats);
                } else if (j<params.length-1) _gradient(params, j+1, 0, stepSize, allFitnesses, bestStats);
                else moveParams(params, allFitnesses, bestStats, stepSize);
            }, 0, bestStats);
        });
    }

    function isBetter(newData, oldData){
        if (newData[1] < oldData[1]) return true;//offset
        if (newData[1] == oldData[1]){
            if (newData[0] > oldData[0]) return true;//num pixels
        }
        return false;
    }

    function evaluate(callback, phase, bestStats){
        if (!running) return;
        if (phase < 1){//render
            render();
            webcam.getFrame();
            setTimeout(function(){//waste time to make sure we get next webcam frame
                window.requestAnimationFrame(function(){
                    evaluate(callback, phase+1, bestStats);
                });
            }, 500);
        } else {
            var _fitness = fitness.calcFitness();
            var currentOffset = fitness.getOutlineOffset();
            showWarn("offset: " + currentOffset + ", fitness: " + _fitness);
            if (_fitness < 0) {
                var nextOutlineOffset = currentOffset + 1;
                if (bestStats && nextOutlineOffset>bestStats[1]){
                    callback(-1, nextOutlineOffset);
                    return;
                }
                if (nextOutlineOffset > 30){
                    callback(_fitness, currentOffset);
                    return;
                }
                sliderInputs['#outlineOffset'](nextOutlineOffset);
                window.requestAnimationFrame(function(){
                    evaluate(callback, 0, bestStats);
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
        var stepSize;
        if (id == "camera"){
            params.push("cameraX");
            params.push("cameraY");
            params.push("cameraZ");
            stepSize = cameraTol;
        } else if (id == "lookAt"){
            params.push("lookAtX");
            params.push("lookAtY");
            stepSize = lookatTol;
        } else if (id == "rotationZero"){
            params.push("rotationZero");
            stepSize = rotationZeroTol;
        } else {
            showWarn("unknown optimization parameter " + id);
            console.warn("unknown optimization parameter " + id);
        }
        optimize(params, stepSize);
    });

    return {
        pause: pause,
        isRunning: isRunning
    }
}