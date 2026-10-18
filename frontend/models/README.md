# Face recognition model

`face_recognition_sface_2021dec.onnx` is **SFace** (fp32) from the
[OpenCV Zoo](https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface), licensed **Apache-2.0**.
It is copied to `public/vendor/sface/sface.onnx` by `scripts/copy-vendor.mjs` on `npm install` and runs
in the browser through `onnxruntime-web` (see `lib/face/engine.ts`).

SHA-256: `0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79`

fp32 is used rather than the 9.9 MB int8 variant: same accuracy, but ~4.5x faster in the browser's
WebAssembly runtime (56 ms vs 249 ms per face on an Apple M4).
