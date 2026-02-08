# TrustFlow 開発ロードマップ (VSCode & Copilot 向け)

Canvasからコードをコピーした後の、次のステップとCopilotへの指示出しのヒントです。

## 1. プロジェクト構造の整理

App.jsx が肥大化してきたら、Copilotに以下のように依頼してコンポーネントを分割しましょう。

**Prompt例:**

```
App.jsx内にあるMarketplace、Scoping、Contractの各ビューを、src/components/配下の独立したファイルに分割してエクスポートして
```

## 2. Firebaseによるデータの永続化

「ポイントの預託」や「契約ステータス」を実際に保存するために、Firebaseの導入をCopilotと進めます。

**Prompt例:**

```
Firebase Firestoreを使用して、selectedJobのステータスとユーザーのポイント残高を保存・同期するロジックを実装して
```

> **注意:** エスクローのルール（Rule 1-3）をCopilotに伝えると、より安全なコードが生成されます。

## 3. AIロジックの実装

現在はダミーデータである「AI診断」や「DoD生成」をGemini APIと連携させます。

**Prompt例:**

```
Gemini APIを使用して、案件の概要からAcceptance Criteria（検収基準）を5つ自動生成する関数を作成して
```

## 4. 紛争解決（Dispute）ロジックの追加

**Prompt例:**

```
AI Inspection Scoreが一定以下の場合に、Dispute（紛争）ビューへ遷移し、運営に通知を送るフローを追加して
```

## 5. エクスポート & レポーティング機能

取引の証拠を残すための機能を実装します。

**Prompt例:**

```
現在表示しているAudit TrailやDoDの合意内容を、jspdfなどのライブラリを使ってPDFとしてエクスポートする機能を実装して
```

---

### 開発時のTips

- **Contextの活用:** VSCodeで App.jsx を開いた状態でCopilot Chatを使うと、コードの文脈を理解した的確なアドバイスがもらえます。
- **環境変数:** APIキーなどは必ず `.env` ファイルに保存し、Copilotに「.envからAPIキーを読み込むように修正して」と伝えましょう。
