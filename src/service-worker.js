// src/service-worker.js
/* eslint-disable no-restricted-globals */

// このコードは、Create React AppのPWA設定を使用しています
// https://create-react-app.dev/docs/making-a-progressive-web-app/

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

clientsClaim();

// 事前キャッシュとルート
precacheAndRoute(self.__WB_MANIFEST);

// シングルページアプリケーション対応
const fileExtensionRegexp = /\/[^/?]+\.[^/]+$/;
registerRoute(
  // ESリントを無効化して、ビルド時のエラーを回避
  // eslint-disable-next-line no-unused-vars
  ({ request, url }) => {
    // 次の場合はナビゲーションリクエストと判断
    if (request.mode !== 'navigate') {
      return false;
    }

    // URLパスに拡張子がある場合はファイルとみなす
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }

    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// 画像のキャッシュ
registerRoute(
  ({ url }) => url.origin === self.location.origin && /\.(jpe?g|png|gif|svg)$/i.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Google Books APIのキャッシュ
registerRoute(
  ({ url }) => url.origin === 'https://www.googleapis.com' && url.pathname.includes('/books/'),
  new StaleWhileRevalidate({
    cacheName: 'google-books-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
  })
);

// キャッシュされたレスポンスを使用
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(workbox.precaching.getCacheKeyForURL('/index.html'));
      })
    );
  }
});

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge-icon.png',
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const url = notification.data.url || '/';
  
  notification.close();
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

// サービスワーカーの更新処理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});