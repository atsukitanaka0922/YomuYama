// src/serviceWorkerRegistration.js
// このコードは、Create React AppのPWA設定を基にしています
// https://github.com/facebook/create-react-app/blob/main/packages/cra-template-pwa/template/src/serviceWorkerRegistration.js

// このオプションの値は、変更しないでください。
// これは公開パスを注入するために使用されます。
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.0/8 are considered localhost for IPv4.
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
  
  export function register(config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      // URLコンストラクタは、SW がサポートするすべてのブラウザで利用可能です。
      const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
      if (publicUrl.origin !== window.location.origin) {
        // PUBLIC_URL が異なるオリジンにある場合、サービスワーカーは機能しません。
        // CDN からサーブされている場合などに発生します。
        // https://github.com/facebook/create-react-app/issues/2374 参照
        return;
      }
  
      window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
  
        if (isLocalhost) {
          // localhost 実行時はサービスワーカーが存在するか確認
          checkValidServiceWorker(swUrl, config);
  
          // localhost はブラウザに追加のログを表示します
          navigator.serviceWorker.ready.then(() => {
            console.log(
              'このウェブアプリケーションは、サービスワーカーによって最初にキャッシュされます。'
            );
          });
        } else {
          // localhostでない場合はサービスワーカーを登録
          registerValidSW(swUrl, config);
        }
      });
  
      // プッシュ通知のためのイベントリスナーを追加
      window.addEventListener('push', event => {
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
            navigator.serviceWorker.registration.showNotification(data.title, options)
          );
      });
    }
  }
  
  function registerValidSW(swUrl, config) {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // 新しいコンテンツがキャッシュされています
                console.log(
                  '新しいコンテンツが利用可能です。更新してください。'
                );
  
                // コールバックを実行
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // すべてがキャッシュされました
                console.log('コンテンツがオフライン用にキャッシュされました。');
  
                // コールバックを実行
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('サービスワーカーの登録エラー:', error);
      });
  }
  
  function checkValidServiceWorker(swUrl, config) {
    // サービスワーカーが見つかるかをチェック、見つからない場合は再ロードします
    fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    })
      .then((response) => {
        // サービスワーカーが存在し、かつJSファイルが取得できることを確認
        const contentType = response.headers.get('content-type');
        if (
          response.status === 404 ||
          (contentType != null && contentType.indexOf('javascript') === -1)
        ) {
          // サービスワーカーが見つかりません。おそらく別のアプリです。ページを更新します。
          navigator.serviceWorker.ready.then((registration) => {
            registration.unregister().then(() => {
              window.location.reload();
            });
          });
        } else {
          // 通常どおりサービスワーカーを登録します
          registerValidSW(swUrl, config);
        }
      })
      .catch(() => {
        console.log('インターネット接続がありません。オフラインモードで実行中です。');
      });
  }
  
  export function unregister() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister();
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  }

  