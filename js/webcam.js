/**
 * Created by amandaghassaei on 12/3/16.
 */


function initWebcam(){

    var play = true;

    function pause(){
        play = false;
    }
    function start(){
        if (play == true) return;
        play = true;
        compatibility.requestAnimationFrame(tick);
    }

    var redThreshold = 200;
    var antiOcclusionX = 160;
    var antiOcclusionY = 200;
    var antiOcclusionWidth = 100;
    var antiOcclusionHeight = 20;

    var video = document.getElementById('webcam');
    var canvas = document.getElementById('canvas');
    try {
        var attempts = 0;
        var readyListener = function(event) {
            findVideoSize();
        };
        var findVideoSize = function() {
            if(video.videoWidth > 0 && video.videoHeight > 0) {
                video.removeEventListener('loadeddata', readyListener);
                onDimensionsReady(video.videoWidth, video.videoHeight);
            } else {
                if(attempts < 10) {
                    attempts++;
                    setTimeout(findVideoSize, 200);
                } else {
                    onDimensionsReady(320, 240);
                }
            }
        };
        var onDimensionsReady = function(width, height) {
            demo_app(width, height);
            compatibility.requestAnimationFrame(tick);
        };

        video.addEventListener('loadeddata', readyListener);

        compatibility.getUserMedia({video: true}, function(stream) {
            try {
                video.src = compatibility.URL.createObjectURL(stream);
            } catch (error) {
                video.src = stream;
            }
            setTimeout(function() {
                    video.play();
                    demo_app();

                    compatibility.requestAnimationFrame(tick);
                }, 500);
        }, function (error) {
            console.warn("WebRTC not available");
        });
    } catch (error) {
        console.warn("error: " + error);
    }


    var gui,ctx,canvasWidth,canvasHeight;
    var img_u8;

    function demo_app(videoWidth, videoHeight) {
        canvasWidth  = canvas.width;
        canvasHeight = canvas.height;
        ctx = canvas.getContext('2d');

        ctx.fillStyle = "rgb(0,255,0)";
        ctx.strokeStyle = "rgb(0,255,0)";

        img_u8 = new jsfeat.matrix_t(320, 240, jsfeat.U8_t | jsfeat.C1_t);

    }

    function tick() {
        if (!play) return;
        compatibility.requestAnimationFrame(tick);
        _getFrame();
    }

    function getFrame(){
        return _getFrame(true);
    }

    function _getFrame(forEval){
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, 320, 240);
            var imageData = ctx.getImageData(0, 0, 320, 240);

            redChannel(imageData.data, 320, 240, img_u8);

            //add anti-occlusion
            var halfWidth = Math.floor(antiOcclusionWidth/2);
            var halfHeight = Math.floor(antiOcclusionHeight/2);
            for (var y=antiOcclusionY-halfHeight;y<antiOcclusionY+halfHeight;y++){
                for (var x=antiOcclusionX-halfWidth;x<antiOcclusionX+halfWidth;x++){
                    var index = img_u8.cols*y + x;
                    if (x<0 || y<0 || x>=img_u8.cols || y>=img_u8.rows) continue;
                    if (img_u8.data[index]>0) continue;
                    img_u8.data[index] = 100;
                }
            }

            // render result back to canvas
            var data_u32 = new Uint32Array(imageData.data.buffer);
            var alpha = (0xff << 24);
            var i = img_u8.cols * img_u8.rows, pix = 0;
            while (--i >= 0) {
                pix = img_u8.data[i];
                data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
            }

            ctx.putImageData(imageData, 0, 0);

            if (forEval) return img_u8;
        } else if (forEval) console.warn("video not ready");
    }

    function redChannel(src, w, h, dst, code) {
        // this is default image data representation in browser
        if (typeof code === "undefined") { code = jsfeat.COLOR_RGBA2GRAY; }
        var x=0, y=0, i=0, j=0, ir=0,jr=0;
        var coeff_r = 4899, coeff_g = 9617, coeff_b = 1868, cn = 4;

        var cn2 = cn<<1, cn3 = (cn*3)|0;

        dst.resize(w, h, 1);
        var dst_u8 = dst.data;

        var thresh = redThreshold;

        for(y = 0; y < h; ++y, j+=w, i+=w*cn) {
            for(x = 0, ir = i, jr = j; x <= w-4; x+=4, ir+=cn<<2, jr+=4) {
                dst_u8[jr]     = src[ir] > thresh ? 255 : 0;
                dst_u8[jr + 1] = src[ir+cn] > thresh ? 255 : 0;
                dst_u8[jr + 2] = src[ir+cn2] > thresh ? 255 : 0;
                dst_u8[jr + 3] = src[ir+cn3] > thresh ? 255 : 0;
            }
            for (; x < w; ++x, ++jr, ir+=cn) {
                dst_u8[jr] = src[ir] > thresh ? src[ir] : 0;
            }
        }
    }

    $(window).on('beforeunload ',function() {
        video.pause();
        video.src=null;
    });

    setSliderInput("#redThreshold", redThreshold, 0, 255, 1, function(val){
        redThreshold = val;
    });
    setSliderInput("#antiOcclusionX", antiOcclusionX, 0, 319, 1, function(val){
        antiOcclusionX = val;
    });
    setSliderInput("#antiOcclusionY", antiOcclusionY, 0, 239, 1, function(val){
        antiOcclusionY = val;
    });
    setSliderInput("#antiOcclusionWidth", antiOcclusionWidth, 0, 320, 1, function(val){
        antiOcclusionWidth = val;
    });
    setSliderInput("#antiOcclusionHeight", antiOcclusionHeight, 0, 240, 1, function(val){
        antiOcclusionHeight = val;
    });

    var occlusionMode = false;
    $("#occlusionMode").click(function(e){
        occlusionMode = !occlusionMode;
        if (occlusionMode){
            scene.background = new THREE.Color(0xff0000);
            if (mesh) mesh.visible = false;
        } else {
            scene.background = new THREE.Color(0x000000);
            if (mesh) mesh.visible = false;
        }
        render();
    });

    $("#playPauseWebcam").click(function(e){
        e.preventDefault();
        if (play) pause();
        else start();
    });

    return {
        getFrame: getFrame,
        pause: pause,
        start: start
    }

}