/**
 * Created by amandaghassaei on 12/2/16.
 */

function initFitness(){

    var _mesh;
    var fitnessMesh;
    var shadowMesh;

    var outlineWidth = 5;
    var outlineOffset = 10;

    function getOutlineOffset(){
        return outlineOffset;
    }

    var vertexShader =
        "uniform float offset;" +
        "void main(){"+
            "vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );"+
            "gl_Position = projectionMatrix * pos;"+
        "}\n";

    var fragmentShaderColor =
        "void main(){"+
            "gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );"+
        "}\n";
    var fragmentShaderBlack =
        "void main(){"+
            "gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );"+
        "}\n";

    var outlineMaterial = new THREE.ShaderMaterial({
        uniforms: {
            offset: {type: 'f', value: outlineOffset+outlineWidth}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderColor
    });
    var shadowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            offset: {type: 'f', value: outlineOffset}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderBlack
    });

    function setMesh(mesh){
        _mesh = mesh;
        if (fitnessMesh) outlineScene1.remove(fitnessMesh);
        if (shadowMesh) outlineScene2.remove(shadowMesh);
        fitnessMesh = mesh.clone();
        shadowMesh = mesh.clone();
        outlineScene1.add(fitnessMesh);
        outlineScene2.add(shadowMesh);
        fitnessMesh.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = outlineMaterial;
            }
        });
        shadowMesh.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = shadowMaterial;
            }
        });
    }

    function sync(){
        if (!fitnessMesh) return;
        fitnessMesh.position.set(_mesh.position.x, _mesh.position.y, _mesh.position.z);
        fitnessMesh.children[0].position.set(_mesh.children[0].position.x, _mesh.children[0].position.y, _mesh.children[0].position.z);
        fitnessMesh.scale.set(_mesh.scale.x, _mesh.scale.y, _mesh.scale.z);
        fitnessMesh.rotation.set(_mesh.rotation.x, _mesh.rotation.y, _mesh.rotation.z);
        shadowMesh.position.set(_mesh.position.x, _mesh.position.y, _mesh.position.z);
        shadowMesh.children[0].position.set(_mesh.children[0].position.x, _mesh.children[0].position.y, _mesh.children[0].position.z);
        shadowMesh.scale.set(_mesh.scale.x, _mesh.scale.y, _mesh.scale.z);
        shadowMesh.rotation.set(_mesh.rotation.x, _mesh.rotation.y, _mesh.rotation.z);

    }

    setSliderInput("#outlineWidth", outlineWidth, 0, 20, 0.01, function(val){
        outlineWidth = val;
        outlineMaterial.uniforms.offset.value = outlineOffset + outlineWidth;
        outlineMaterial.uniforms.offset.needsUpdate = true;
        render();
    });
    setSliderInput("#outlineOffset", outlineOffset, 0, 100, 0.1, function(val){
        outlineOffset = val;
        outlineMaterial.uniforms.offset.value = outlineOffset + outlineWidth;
        outlineMaterial.uniforms.offset.needsUpdate = true;
        shadowMaterial.uniforms.offset.value = outlineOffset;
        shadowMaterial.uniforms.offset.needsUpdate = true;
        render();
    });

    $('#showOutline').prop('checked', false);
    $('#showOutline').change(function() {
        setVisiblity(this.checked);
        render();
    });
    setVisiblity(false);

    function setVisiblity(state){
        outlineMaterial.visible = state;
        shadowMaterial.visible = state;
    }

    function groupRegions(segmentNum, img_u8){
        var numIter = 0;
        var solved = false;
        while (solved == false){
            numIter++;
            var _solved = true;
            for (var i=0;i<segmentNum.length;i++){
                var val = segmentNum[i];
                if (val<0) continue;
                var neighbors = [];
                if (i>0) {
                    neighbors.push(segmentNum[i-1]);
                    if (i>=img_u8.cols+1){
                        neighbors.push(segmentNum[i-img_u8.cols-1]);
                    }
                    if (i>=img_u8.cols){
                        neighbors.push(segmentNum[i-img_u8.cols]);
                    }
                    if (i>=img_u8.cols-1){
                        neighbors.push(segmentNum[i-img_u8.cols+1]);
                    }
                }
                if (i<segmentNum.length-1) {
                    neighbors.push(segmentNum[i+1]);
                    if (i<segmentNum.length-img_u8.cols-1){
                        neighbors.push(segmentNum[i+img_u8.cols+1]);
                    }
                    if (i<segmentNum.length-img_u8.cols){
                        neighbors.push(segmentNum[i+img_u8.cols]);
                    }
                    if (i<segmentNum.length-img_u8.cols+1){
                        neighbors.push(segmentNum[i+img_u8.cols-1]);
                    }
                }
                for (var k=neighbors.length-1;k>=0;k--){
                    if (neighbors[k]<0) neighbors.splice(k, 1);
                }
                var min = Math.min.apply(null, neighbors);
                if (min<val) {
                    segmentNum[i] = min;
                    _solved = false;
                }
            }
            solved = _solved;
            if (numIter>1000){
                showWarn("exceeded 1000 iterations of segmentation");
                console.warn("exceeded 1000 iterations of segmentation");
                solved = true;
            }
        }
        var allSegments = [];
        for (var i=0;i<segmentNum.length;i++){
            var val = segmentNum[i];
            if (val<0) continue;
            if (allSegments.indexOf(val)<0) allSegments.push(val);
        }
        return allSegments;
    }

    function calcAreas(segmentNum, allSegments){
        var allAreas = [];
        for (var i=0;i<allSegments.length;i++){
            allAreas.push(0);
        }
        for (var i=0;i<segmentNum.length;i++){
            var val = segmentNum[i];
            if (val < 0) continue;
            var index = allSegments.indexOf(val);
            allAreas[index] = allAreas[index]+1;
        }
        return allAreas;
    }

    function calcFitness(){
        var img_u8 = webcam.getFrame();
        var data = img_u8.data;

        //segmentation
        var segmentNum = new Int32Array(data.length);
        for (var i=0;i<data.length;i++){
            if (data[i]>0) {
                segmentNum[i] = i;
            } else {
                segmentNum[i] = -1;
            }
        }
        var allSegments = groupRegions(segmentNum, img_u8);

        //get segment areas
        var allAreas = calcAreas(segmentNum, allSegments);

        //find largest partition by area
        var maxSegment = Math.max.apply(null, allAreas);
        var loopIndex = allAreas.indexOf(maxSegment);
        var segment = allSegments[loopIndex];

        //check for closed loop (two distinct non-segment regions)
        for (var i=0;i<segmentNum.length;i++){
            var val = segmentNum[i];
            if (val == segment) segmentNum[i] = -1;//set all white regions in segment to -1
            else segmentNum[i] = i;
        }
        allSegments = groupRegions(segmentNum, img_u8);
        if (allSegments.length == 1) return -1;//no loop
        allAreas = calcAreas(segmentNum, allSegments);

        var max = Math.max.apply(null, allAreas);
        var maxIndex = allAreas.indexOf(max);
        allAreas.splice(maxIndex, 1);//this is the outer region
        max = Math.max.apply(null, allAreas);
        if (max < 3000) {
            console.warn("max seg too small");
            return -1;
        }//too small

        return maxSegment;//area of loop
    }

    return {
        setMesh: setMesh,
        sync: sync,
        calcFitness: calcFitness,
        getOutlineOffset: getOutlineOffset,
        setVisiblity: setVisiblity
    }
}