# 46 Method Coffee Timer

46メソッド向けのスマホファーストな抽出タイマーです。豆量、抽出比率、投数、焙煎度を入力すると、総湯量、各投の湯量、開始時刻、温度目安を自動計算します。

## ローカル起動

```bash
npm install
npm run dev
```

ブラウザで表示されたローカルURLを開きます。

## ビルド確認

```bash
npm run build
npm run preview
```

## GitHub Pages公開手順

1. このリポジトリをGitHubへpushします。
2. GitHubのリポジトリ画面で `Settings` → `Pages` を開きます。
3. `Build and deployment` の `Source` を `GitHub Actions` にします。
4. `main` ブランチへpushすると `.github/workflows/deploy.yml` が実行されます。
5. buildされた `dist` がGitHub Pagesへデプロイされます。

## 公開URL

```text
https://ShunMatsushita.github.io/coffee_timer/
```

Viteの `base` は実リポジトリ名に合わせて `/coffee_timer/` に設定しています。

## CI/CD

このリポジトリには2つのGitHub Actions workflowがあります。

- `CI`: `main` へのpushとpull requestで `npm ci`、`npm test`、`npm run build` を実行します。
- `Deploy to GitHub Pages`: `main` へのpushで `npm ci`、`npm test`、`npm run build` を実行し、成功した `dist` をGitHub Pagesへデプロイします。

## よくあるトラブル

画面が真っ白になる場合:

- `vite.config.ts` の `base` がリポジトリ名と一致しているか確認してください。
- このリポジトリでは `base: "/coffee_timer/"` です。

GitHub Actionsが失敗する場合:

- ローカルで `npm run build` が通るか確認してください。
- `package-lock.json` がコミットされているか確認してください。
- GitHub Pagesの `Source` が `GitHub Actions` になっているか確認してください。
