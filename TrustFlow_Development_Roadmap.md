---
# 10. 設計変更・機能修正の運用ルール

## 10.1. 設計変更・修正フロー

- 実装中やユーザーテストで「機能修正・設計変更」が必要になった場合、まずこのMarkdownに「設計変更案・理由・影響範囲」を記述する。
- 記述後、合意または自己確認の上で実装作業に着手する。
- 実装後は「設計変更内容・修正内容・差分」をこのMDに追記し、履歴を残す。

## 10.2. 運用メリット

- 仕様ブレ・認識齟齬を防ぎ、後からの振り返りや説明が容易になる。
- チーム開発や将来のメンテナンス時にも有効。
---

# 9. Edge Case Features: Implementation Checklist & UI Design Principles

## 9.1. 必要なエッジケース機能（ToDoリスト）

- 途中キャンセル（契約進行中のキャンセル、理由入力、履歴記録、進捗ロック）
- 支払い遅延・失敗（遅延シミュレーション、リマインド、再試行、管理者連絡）
- 再交渉・条件変更（納期・金額・スコープ変更、合意フロー、履歴記録）
- 複数回リジェクト・強制Dispute（リジェクト回数制限、自動Dispute移行、管理者介入）
- 一時停止・再開（進捗保留・再開、履歴記録）
- 管理者介入UI（Disputeや異常系発生時の強制終了・再開ボタン）

## 9.2. UI設計・運用指針

- 基本フローを主役に、異常系は「サブ操作」として限定的に配置（例：︙メニューや小ボタン）
- 状態ごとに表示/非表示を切り替え、常に全てのボタンを出さない
- 異常系実行時は必ず確認モーダルを挟み、誤操作防止
- 進捗・履歴・トースト通知で状態変化を明示
- 状態遷移は「進行中→キャンセル済み」「進行中→一時停止中→再開」など分かりやすく限定

> ※まずはサブ操作として追加し、ユーザーテストで煩雑さを感じるか検証→必要に応じてUI調整する方針が現実的

---

（必要に応じてワイヤーフレームや具体的なUI案も作成可能）

# TrustFlow Development Roadmap

## 1. Project Structure

- Modularize large files (e.g., App.jsx) into components, views, hooks, lib, etc.
- Follow the protocol's directory structure for scalability.

## 2. Data Persistence

- Use Firebase Firestore or similar to persist point balances and contract status.
- Example prompt: "Use Firebase Firestore to save and sync selectedJob and user point balance."

# TrustFlow Development Roadmap & Operational Guide

## 1. Project Structure

- Modularize large files (e.g., App.jsx) into components, views, hooks, lib, etc.
- Follow the protocol's directory structure for scalability.

## 2. Data Persistence

- Use Firebase Firestore or similar to persist point balances and contract status.
- Example prompt: "Use Firebase Firestore to save and sync selectedJob and user point balance."

## 3. AI Logic

- Integrate Gemini API or similar for DoD generation and AI diagnosis.
- Example prompt: "Use Gemini API to generate 5 Acceptance Criteria from project summary."

## 4. Dispute Resolution

- Add logic to transition to Dispute view if AI Inspection Score is low.
- Notify admin for arbitration.

## 5. Export & Reporting

- Implement PDF export of Audit Trail and DoD using libraries like jspdf.

## 6. Real-World Operational Challenges & Solutions

### 6.1. Subjectivity Gap

- **Issue:** AI can check DoD, but not subjective quality (e.g., "good design").
- **Solution:**
  - Human Arbiter Escalation: Summon certified experts for final decision.
  - Partial Release: AI proposes partial payment for partial completion.

### 6.2. Ghosting (Unresponsive Clients)

- **Issue:** Client does not respond after delivery; funds frozen.
- **Solution:**
  - Auto-Release Timer: After 72h of no action, funds are released automatically.

### 6.3. AML & KYC

- **Issue:** Risk of money laundering, need for identity verification.
- **Solution:**
  - eKYC Integration: Online ID verification (ID scan, face photo).
  - Trust Score History: Record and present payment/dispute history.

### 6.4. Security & Deliverable Guarantee

- **Issue:** Malware or non-working code in deliverables.
- **Solution:**
  - Cloud Sandbox Preview: Run code in isolated containers, show preview.
  - Virus Scan Shield: Scan uploads for malware.

## 7. Implementation Priorities

- Auto-Release Timer (Low difficulty, high effect)
- Escalation UI (Medium)
- eKYC (High, essential)

## 8. Development Tips

- Use Copilot/VSCode context for best results.
- Store API keys in `.env` files.
- Use prompts to guide Copilot for modularization, AI, and backend logic.
- For all formatting and data handling, use shared utility functions in `src/lib/utils.js`:
  - `formatNumber` for numbers
  - `formatDate` for dates
  - `truncate` for strings
  - `uniqueArray` for arrays
    This ensures robust, consistent, and maintainable code.
