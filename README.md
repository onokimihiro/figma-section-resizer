# Section Resizer — Figma Plugin

セクションのパディングを指定してリサイズするFigmaプラグインです。

## ファイル構成

```
figma-section-resizer/
├── manifest.json   # プラグイン設定
├── code.js         # バックエンド（Figma API操作）
├── code.ts         # バックエンド（TypeScriptソース）
└── ui.html         # プラグインUI
```

## Figmaへの導入手順

1. Figmaデスクトップアプリを開く
2. メニュー → **Plugins** → **Development** → **Import plugin from manifest...**
3. このフォルダの `manifest.json` を選択
4. メニュー → **Plugins** → **Development** → **Section Resizer** で起動

## 使い方

1. プラグインを起動するとパディング入力フォームが表示される
2. 上下左右のパディング値を入力（🔗リンクアイコンで連動ON/OFF切替可能）
3. Figma上でリサイズしたいセクションを1つ以上選択
4. 「リサイズ」ボタンをクリック

## 機能

- ✅ 上下左右個別のパディング指定
- ✅ 🔗 リンクアイコンで4辺の値を連動
- ✅ 複数セクションの一括リサイズ
- ✅ セクション未選択時のエラー表示
- ✅ 子要素の位置も自動調整

## TypeScriptでビルドする場合（任意）

ビルド環境を整えたい場合は以下を参考に：

```bash
npm init -y
npm install --save-dev typescript @figma/plugin-typings

# tsconfig.json を作成
npx tsc --init

# コンパイル
npx tsc code.ts --target ES6 --lib ES6 --outDir .
```

`tsconfig.json` の設定例：
```json
{
  "compilerOptions": {
    "target": "ES6",
    "lib": ["ES6"],
    "strict": true,
    "typeRoots": ["./node_modules/@figma/plugin-typings"]
  }
}
```

## 注意

- `code.js` はすでにコンパイル済みのため、TypeScriptビルド環境なしでそのまま動作します
- Figmaプラグインはビルドツール（Vite/webpack）なしでもシンプルな構成で動作します
