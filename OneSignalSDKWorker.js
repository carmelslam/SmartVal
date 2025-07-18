importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Add message listener synchronously to fix WorkerMessenger warning
self.addEventListener('message', function(event) {
  // OneSignal SDK will handle the message
});

// Version stamp to force service worker update
const SW_VERSION = "1.0.1";