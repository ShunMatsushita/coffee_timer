先ほどの「46メソッド抽出タイマー」React + Vite + TypeScriptアプリを、GitHub Pagesで公開できるところまで実装してください。

## 追加要件
- GitHub Pagesで公開可能にする
- GitHub Actionsで自動デプロイする
- mainブランチにpushしたら自動でbuild & deployされる構成にする
- Viteのbase設定をGitHub Pages用に対応させる
- READMEに公開手順を書く

## 前提
リポジトリ名は `coffee-brew-timer` とします。
公開URLは以下を想定します。

https://<GitHubユーザー名>.github.io/coffee-brew-timer/

そのため、vite.config.ts の base は以下にしてください。

base: "/coffee-brew-timer/"

## 実装してほしいこと

1. Vite設定
- vite.config.ts に base: "/coffee-brew-timer/" を設定
- build結果が正常に出るようにする

2. GitHub Actions
以下のファイルを作成してください。

.github/workflows/deploy.yml

内容は、GitHub Pagesへデプロイする公式推奨構成にしてください。

要件:
- mainブランチへのpushで実行
- npm ci
- npm run build
- dist を GitHub Pages にアップロード
- GitHub Pagesへデプロイ

3. package.json
以下のscriptsを確認・追加してください。

- dev
- build
- preview

4. README.md
以下を記載してください。

- アプリ概要
- ローカル起動方法
- GitHub Pages公開手順
- GitHub側で必要な設定
  - Settings → Pages
  - Source を GitHub Actions にする
- 公開URL
- よくあるトラブル
  - 画面が真っ白になる場合は vite.config.ts の base を確認
  - Actionsが失敗する場合は npm run build が通るか確認

5. 動作確認
- npm install
- npm run build
- npm run preview
で動くことを確認できる状態にしてください。

## GitHub Actions deploy.yml の方針
以下のような構成で作ってください。

- permissions:
  - contents: read
  - pages: write
  - id-token: write
- actions/checkout
- actions/setup-node
- npm ci
- npm run build
- actions/configure-pages
- actions/upload-pages-artifact
- actions/deploy-pages

## Done when
- mainにpushするとGitHub Actionsが走る
- GitHub Pagesで公開できる
- READMEを見れば自分で公開設定できる
- Viteのbase設定ミスで真っ白にならない