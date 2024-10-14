import { precacheAndRoute } from 'workbox-precaching';
import '@uppy/golden-retriever/lib/ServiceWorker';

// Precache the assets injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Additional service worker logic
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
