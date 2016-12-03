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

    var redThreshold = 100;

    // lets do some fun
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
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, 320, 240);
            var imageData = ctx.getImageData(0, 0, 320, 240);

            redChannel(imageData.data, 320, 240, img_u8);

            // render result back to canvas
            var data_u32 = new Uint32Array(imageData.data.buffer);
            var alpha = (0xff << 24);
            var i = img_u8.cols*img_u8.rows, pix = 0;
            while(--i >= 0) {
                pix = img_u8.data[i];
                data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
            }

            ctx.putImageData(imageData, 0, 0);

        }
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

    $("#playPauseWebcam").click(function(e){
        e.preventDefault();
        if (play) pause();
        else start();
    });


}