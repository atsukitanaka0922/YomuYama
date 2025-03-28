# YomuYama

本の管理、シリーズの整理、読書進捗の追跡などを行うためのReactウェブアプリケーションです。PCとスマートフォンの両方で使用できるPWA（Progressive Web App）として実装されています。

## 機能

- **本の管理**
  - 本の追加、編集、削除
  - Google Books APIを使った本の検索
  - 本の詳細情報の表示
  - 読書状態の追跡（未読、読書中、完読）

- **シリーズ管理**
  - シリーズの作成と管理
  - シリーズ内の本の整理
  - シリーズの収集進捗表示

- **新刊情報**
  - 新刊の発売日追跡
  - 近日発売の本の通知

- **便利な機能**
  - 複数の本をまとめて追加
  - 本の検索とフィルタリング
  - 読書統計（読書タワー）
  - カスタムカテゴリー設定

## 技術スタック

- **フロントエンド**：React.js、Material-UI
- **バックエンド**：Firebase（認証、Firestore）
- **API**：Google Books API
- **PWA対応**：Service Worker、オフラインサポート
- **アニメーション**：Framer Motion

## インストールと実行

### 前提条件

- Node.js (v14 以上)
- npm または yarn
- Firebaseアカウント

### セットアップ手順

1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/book-manager.git
cd book-manager
```

2. 依存パッケージのインストール

```bash
npm install
# または
yarn install
```

3. Firebaseの設定

- Firebaseコンソールでプロジェクトを作成
- Webアプリを追加して設定情報を取得
- `src/firebase.js` に設定情報を追加

```javascript
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
```

4. 開発サーバーの起動

```bash
npm start
# または
yarn start
```

5. ビルドと本番環境へのデプロイ

```bash
npm run build
# または
yarn build
```

## プロジェクト構造

```
src/
├── api/                 # API関連のコード
├── components/          # 再利用可能なコンポーネント
├── contexts/            # コンテキストプロバイダー
├── pages/               # ページコンポーネント
├── utils/               # ユーティリティ関数
├── App.js               # アプリのメインコンポーネント
├── firebase.js          # Firebase設定
├── index.js             # エントリーポイント
└── index.css            # グローバルスタイル
```

## 主な機能の説明

### 1. 本の管理

本のタイトル、著者、出版日などの基本情報を登録できます。Google Books APIを使って書籍情報を検索・取得することも可能です。各本には読書状態（未読、読書中、完読）を設定できます。

### 2. シリーズ管理

複数の本をシリーズとしてグループ化できます。シリーズページでは収集進捗を視覚的に確認できます。シリーズの全巻数を設定することで、収集の完了度を把握できます。

### 3. 新刊スケジュール

続刊の発売日を記録し、発売日が近づくとアプリ内で通知を受け取ることができます。近日発売の本をまとめて表示するビューもあります。

### 4. 読書タワー

未読の本と完読した本をタワー状に積み上げて視覚化します。全体の高さや読了ページ数など、読書の進捗を別の視点から把握できます。

## 貢献方法

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## ライセンス

[MIT License](LICENSE)

## 謝辞

- [Google Books API](https://developers.google.com/books) - 書籍情報の取得に使用
- [Material-UI](https://mui.com/) - UIコンポーネント
- [Firebase](https://firebase.google.com/) - バックエンドサービス
- [Framer Motion](https://www.framer.com/motion/) - アニメーション

---
v1.0.0 YomuYamaの正式リリース
---

作成者: 田中 敦喜  
連絡先: atsuki7660@gmail.com
