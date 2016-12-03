/**
 * Created by amandaghassaei on 12/2/16.
 */

function initFitness(){

    var _mesh;
    var fitnessMesh;
    var shadowMesh;

    var lineWidth = 10;


    var vertexShader =
        "uniform float offset;" +
        "void main(){"+
            "vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );"+
            "gl_Position = projectionMatrix * pos;"+
        "}\n";

    var fragmentShaderColor =
        "void main(){"+
            "gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 );"+
        "}\n";
    var fragmentShaderBlack =
        "void main(){"+
            "gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );"+
        "}\n";

    var outlineMaterial = new THREE.ShaderMaterial({
        uniforms: {
            offset: {type: 'f', value: 20.0}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderColor
    });
    var shadowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            offset: {type: 'f', value: 10.0}
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
        fitnessMesh.position.set(_mesh.position.x, _mesh.position.y, _mesh.position.z);
        fitnessMesh.children[0].position.set(_mesh.children[0].position.x, _mesh.children[0].position.y, _mesh.children[0].position.z);
        fitnessMesh.scale.set(_mesh.scale.x, _mesh.scale.y, _mesh.scale.z);
        fitnessMesh.rotation.set(_mesh.rotation.x, _mesh.rotation.y, _mesh.rotation.z);
        shadowMesh.position.set(_mesh.position.x, _mesh.position.y, _mesh.position.z);
        shadowMesh.children[0].position.set(_mesh.children[0].position.x, _mesh.children[0].position.y, _mesh.children[0].position.z);
        shadowMesh.scale.set(_mesh.scale.x, _mesh.scale.y, _mesh.scale.z);
        shadowMesh.rotation.set(_mesh.rotation.x, _mesh.rotation.y, _mesh.rotation.z);

    }

    return {
        setMesh: setMesh,
        sync: sync
    }
}