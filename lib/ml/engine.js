import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useRef } from "react";
import { WebView } from "react-native-webview";

// Use model files served by your ML server
const ML_SERVER_URL = process.env.EXPO_PUBLIC_ML_SERVER_URL;

if (!ML_SERVER_URL) {
  console.error('❌ CRITICAL: EXPO_PUBLIC_ML_SERVER_URL is not set in .env file!');
}

console.log('✅ ML Engine - Server URL:', ML_SERVER_URL);

const MODEL_URL = `${ML_SERVER_URL}/model/food/model.json`;
const META_URL = `${ML_SERVER_URL}/model/food/metadata.json`;


let webviewRef = null;
let nextId = 1;
const pending = new Map();

function sendToEngine(msg) {
  if (!webviewRef) throw new Error("ML engine not mounted");
  webviewRef.postMessage(JSON.stringify(msg));
}

// Exposed API: classify a local/file/http image URI and get top prediction
export async function classifyUri(uri) {
  // Convert local file/content URIs to base64 data URL so WebView can load it
  let payload = uri;
  try {
    const lower = String(uri || "");
    if (lower.startsWith("data:")) {
      // already a data URL
      payload = uri;
    } else if (lower.startsWith("file:") || lower.startsWith("content:")) {
      console.log("Converting image URI to base64:", uri);
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      console.log("Base64 length:", b64.length);
      
      // Sniff a few common types to set a compatible MIME
      let mime = 'image/jpeg';
      const head = b64.slice(0, 8);
      if (head.startsWith('iVBORw0K')) mime = 'image/png';
      else if (head.startsWith('R0lGOD')) mime = 'image/gif';
      // Note: HEIC/HEIF may not decode in WebView; consider converting upstream if needed
      payload = `data:${mime};base64,${b64}`;
      console.log("Created data URL with mime:", mime);
    }
  } catch (error) {
    console.error("Error converting image:", error);
    throw new Error(`Failed to convert image: ${error.message}`);
  }

  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    try {
      sendToEngine({ type: "classify", id, data: payload });
    } catch (e) {
      pending.delete(id);
      reject(e);
    }
  });
}

// React component to mount once at app root
export function MlEngine() {
  const ref = useRef(null);

  useEffect(() => {
    // set global ref on mount
    webviewRef = ref.current;
    return () => {
      // cleanup
      if (webviewRef === ref.current) webviewRef = null;
      pending.forEach(p => p.reject(new Error("ML engine unmounted")));
      pending.clear();
    };
  }, []);

  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "ready") return; // model loaded
      if (msg.type === "result" || msg.type === "error") {
        const entry = pending.get(msg.id);
        if (!entry) return;
        pending.delete(msg.id);
        if (msg.type === "result") entry.resolve(msg.top);
        else entry.reject(new Error(msg.message || "ML error"));
      }
    } catch {}
  };

  // Inline HTML engine loads tfjs + TM and runs predictions
  const html = `
  <!doctype html><html><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.4/dist/teachablemachine-image.min.js"></script>
  </head><body>
    <script>
      const MODEL_URL = ${JSON.stringify(MODEL_URL)};
      const META_URL  = ${JSON.stringify(META_URL)};
      let model = null;

      async function ensure() {
        if (!model) {
          try {
            console.log('🔄 Loading ML model from:', MODEL_URL);
            console.log('🔄 Loading metadata from:', META_URL);
            model = await tmImage.load(MODEL_URL, META_URL);
            console.log('✅ ML model loaded successfully!');
          } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            console.error('❌ Model load failed:', e);
            console.error('Model URL:', MODEL_URL);
            console.error('Meta URL:', META_URL);
            throw new Error('Model load failed: ' + msg);
          }
        }
        return model;
      }

      async function classify(data) {
        const m = await ensure();
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        // Add more detailed error handling
        await new Promise((res, rej) => {
          img.onload = () => {
            console.log('Image loaded successfully, size:', img.width + 'x' + img.height);
            res();
          };
          img.onerror = (event) => {
            console.error('Image load failed:', event);
            console.error('Data URL length:', data ? data.length : 0);
            console.error('Data URL start:', data ? data.substring(0, 50) : 'no data');
            rej(new Error('Image load failed - check if image data is valid'));
          };
          img.src = data; // base64 data URL or http(s)
        });
        
        const preds = await m.predict(img);
        preds.sort((a,b)=>b.probability - a.probability);
        const top = preds[0];
        return { className: top.className, probability: top.probability };
      }

      function reply(msg) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }

      function handle(data) {
        try {
          const msg = JSON.parse(data);
          if (msg.type === "classify") {
            classify(msg.data)
              .then(top => reply({ type:"result", id: msg.id, top }))
              .catch(err => {
                const m = (err && err.message) ? err.message : String(err);
                reply({ type:"error",  id: msg.id, message: m });
              });
          }
        } catch (e) {
          reply({ type:"error", id: 0, message: "Bad message" });
        }
      }

      document.addEventListener("message", (ev) => handle(ev.data));
      window.addEventListener("message",  (ev) => handle(ev.data)); // iOS bridge

      reply({ type: "ready" });
    </script>
  </body></html>`;

  return (
    <WebView
      ref={ref}
      originWhitelist={["*"]}
      source={{ html }}
      onMessage={onMessage}
      style={{ width: 1, height: 1, opacity: 0 }}
      allowFileAccess
      allowUniversalAccessFromFileURLs
      javaScriptEnabled
    />
  );
}