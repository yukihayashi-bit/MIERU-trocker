# MIERU - システム仕様書

**バージョン:** 0.1.0  
**作成日:** 2026-04-13  
**最終コミット:** ハイブリッド認証（管理者メール＆スタッフID）の実装

---

## 1. プロダクト概要

**MIERU** は、病院・看護現場向けのタイムスタディ（業務量調査）SaaS アプリケーションである。スタッフがスマートフォンで業務の開始・終了を打刻し、管理者がダッシュボードで業務分布を可視化・分析できる。

### 1.1 ターゲットユーザー

| ロール | 対象 | 主な利用機能 |
|--------|------|-------------|
| 管理者（admin） | 看護師長、病棟管理者 | ダッシュボード、スタッフ管理、カテゴリ管理 |
| スタッフ（user） | 看護師、病棟スタッフ | 打刻（タイムトラッカー）、自分の履歴確認 |

### 1.2 主要機能一覧

1. **打刻（タイムトラッカー）** - ストップウォッチ形式で業務時間を記録
2. **ダッシュボード** - KPI、円グラフ、棒グラフ、直近の打刻履歴
3. **業務カテゴリ管理** - 2階層（マスター＋テナント独自）のカテゴリ体系
4. **スタッフ管理** - スタッフID方式でのユーザー追加
5. **メンバー管理** - メールアドレス方式でのユーザー追加
6. **ハイブリッド認証** - 管理者はメール、スタッフはスタッフID+病院コードでログイン
7. **マルチテナント** - 病院ごとのデータ完全分離（RLS）

---

## 2. 技術スタック

### 2.1 フロントエンド

| 項目 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js (App Router) | 16.2.1 |
| ランタイム | React | 19.2.4 |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 4.x |
| UIコンポーネント | shadcn/ui (Base UI) | 4.1.0 |
| アイコン | Lucide React | 1.7.0 |
| フォーム | React Hook Form + Zod | 7.72.0 / 4.3.6 |
| チャート | Recharts | 3.8.1 |
| 日付処理 | date-fns | 4.1.0 |

### 2.2 バックエンド

| 項目 | 技術 |
|------|------|
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| API方式 | Next.js Server Actions（REST API なし） |
| セッション管理 | HTTP-only Cookie (SSR) |

### 2.3 インフラ（計画）

| 項目 | 技術 |
|------|------|
| ホスティング | Vercel |
| 決済 | Stripe（従量課金・未実装） |

---

## 3. アーキテクチャ

### 3.1 全体構成

```
[ブラウザ/スマホ]
    │
    ▼
[Next.js App Router (RSC + Server Actions)]
    │
    ├── Supabase Auth（認証・セッション）
    │
    └── Supabase PostgreSQL（RLS 付きデータ）
```

### 3.2 ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/                    # 認証グループ
│   │   ├── login/page.tsx         # ログイン画面
│   │   ├── signup/page.tsx        # 新規登録画面
│   │   └── layout.tsx
│   ├── (dashboard)/               # 認証済みグループ
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # メインダッシュボード
│   │   │   ├── kpi-cards.tsx      # KPI カード
│   │   │   ├── charts.tsx         # 円グラフ・棒グラフ
│   │   │   ├── recent-logs.tsx    # 直近の打刻一覧
│   │   │   ├── members/page.tsx   # メンバー管理
│   │   │   └── settings/
│   │   │       ├── staff/page.tsx      # スタッフ管理
│   │   │       └── categories/page.tsx # カテゴリ管理
│   │   └── tracker/
│   │       ├── page.tsx           # 打刻画面
│   │       ├── timer-display.tsx  # ストップウォッチ
│   │       ├── today-logs.tsx     # 今日の履歴
│   │       └── category-dialog.tsx # カテゴリ選択モーダル
│   ├── actions/                   # Server Actions
│   │   ├── auth.ts
│   │   ├── tracker.ts
│   │   ├── dashboard.ts
│   │   ├── categories.ts
│   │   ├── members.ts
│   │   └── staff.ts
│   ├── layout.tsx                 # ルートレイアウト
│   └── globals.css
├── components/ui/                 # shadcn/ui コンポーネント
├── lib/
│   ├── supabase/
│   │   ├── server.ts              # サーバー側クライアント
│   │   ├── client.ts              # クライアント側クライアント
│   │   ├── middleware.ts          # 認証ミドルウェア
│   │   └── admin.ts              # service_role クライアント
│   ├── dummy-email.ts             # ダミーメール生成
│   └── utils.ts
├── types/database.ts              # 型定義
└── middleware.ts                   # Next.js ミドルウェア
```

### 3.3 マルチテナント設計

- 全データテーブルに `tenant_id` カラムを保持
- Supabase RLS（Row Level Security）によりテナント間のデータを完全分離
- 管理操作（ユーザー作成、テナント初期化）は `service_role` キーで RLS をバイパス

---

## 4. データベース設計

### 4.1 テーブル一覧

#### tenants（病院マスタ）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | テナントID |
| name | text | 病院名 |
| hospital_code | text (UNIQUE) | 病院コード（英小文字+数字 8桁、自動生成） |
| stripe_customer_id | text | Stripe 顧客ID（未使用） |
| stripe_subscription_id | text | Stripe サブスクリプションID（未使用） |
| status | text | ステータス: `active` / `inactive` / `trial` |
| created_at | timestamptz | 作成日時 |

#### users（ユーザー）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | Supabase Auth の user.id と一致 |
| tenant_id | UUID (FK) | 所属テナント |
| role | text | `admin` / `user` |
| name | text | 氏名 |
| staff_id | text | スタッフID（管理者は `"admin"`） |
| created_at | timestamptz | 作成日時 |

#### master_categories（マスターカテゴリ - Level 1）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | カテゴリID |
| name | text | カテゴリ名（例: 直接ケア、間接ケア、記録） |
| description | text | 説明 |
| sort_order | integer | 表示順 |

**プリセット値:**
1. 直接ケア
2. 間接ケア
3. 記録
4. カンファレンス
5. その他

#### tenant_categories（テナントカテゴリ - Level 2）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | カテゴリID |
| tenant_id | UUID (FK) | 所属テナント |
| master_category_id | UUID (FK) | 親マスターカテゴリ |
| name | text | カテゴリ名（例: バイタル測定、清潔ケア） |
| color | text | 表示色（HEX） |
| is_active | boolean | 有効/無効 |
| created_at | timestamptz | 作成日時 |

**デフォルトサブカテゴリ（新規テナント自動投入）:**

| マスター | サブカテゴリ |
|---------|-------------|
| 直接ケア | バイタル測定、清潔ケア、与薬・注射、食事介助、排泄介助、患者対応・ナースコール |
| 間接ケア | 移動・搬送、巡視 |
| 記録 | 看護記録、指示受け・伝達 |
| カンファレンス | カンファレンス、申し送り |
| その他 | 休憩、その他 |

#### time_logs（打刻記録）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | ログID |
| user_id | UUID (FK) | 打刻者 |
| tenant_id | UUID (FK) | 所属テナント |
| category_id | UUID (FK, nullable) | 業務カテゴリ（終了時に設定） |
| start_time | timestamptz | 打刻開始時刻 |
| end_time | timestamptz (nullable) | 打刻終了時刻 |
| duration_seconds | integer (nullable) | 経過秒数（終了時に計算） |
| created_at | timestamptz | 作成日時 |

### 4.2 ER図（概略）

```
tenants ──┬── users ──── time_logs
          │                  │
          └── tenant_categories ──┘
                    │
          master_categories
```

---

## 5. 画面仕様

### 5.1 ログイン画面 (`/login`)

**概要:** ハイブリッド認証に対応したログインフォーム

**入力項目:**
- 病院コード（スタッフID ログイン時のみ必須）
- メールアドレス or スタッフID
- パスワード

**ロジック:**
- `@` を含む場合 → メールアドレスとして直接ログイン（管理者向け）
- `@` を含まない場合 → スタッフID＋病院コードからダミーメールを合成してログイン
  - ダミーメール形式: `{staffId}@{hospitalCode}.mieru-dummy.local`

**遷移:** ログイン成功 → `/dashboard`

### 5.2 新規登録画面 (`/signup`)

**概要:** 病院と管理者アカウントの同時登録

**入力項目:**
- 病院名
- 管理者氏名
- メールアドレス
- パスワード（6文字以上）

**処理フロー:**
1. 病院コード（8桁英数字）を自動生成（重複チェック付き、最大5回リトライ）
2. Supabase Auth にユーザー作成
3. `tenants` テーブルに病院を登録（ステータス: `trial`）
4. `users` テーブルに管理者として登録（`staff_id: "admin"`）
5. エラー時はロールバック（Auth ユーザー削除、テナント削除）

**遷移:** 登録成功 → `/dashboard`

### 5.3 打刻画面 (`/tracker`)

**概要:** モバイルファーストのストップウォッチ式打刻インターフェース

**コンポーネント:**
- **TimerDisplay** - 「開始」「停止」ボタンとストップウォッチ表示
- **CategoryDialog** - 停止時にカテゴリを選択するモーダル（マスターカテゴリでグルーピング表示）
- **TodayLogs** - 今日の完了済み打刻一覧

**打刻フロー:**
1. 「開始」タップ → `time_logs` に `start_time` を INSERT（`category_id` は null）
2. ストップウォッチが動き続ける（ページリロードしても復帰可能）
3. 「停止」タップ → カテゴリ選択ダイアログが開く
4. カテゴリ選択 → `end_time`, `duration_seconds`, `category_id` を UPDATE

**初回アクセス時:** テナントにカテゴリが未設定の場合、デフォルトカテゴリを自動投入（`seedTenantCategories`）

### 5.4 ダッシュボード (`/dashboard`)

**概要:** テナント全体の業務分析画面

**構成要素:**

#### KPI カード（4枚）
| KPI | 内容 |
|-----|------|
| 今日の合計時間 | テナント全体の本日打刻時間合計（時間:分） |
| 今月の合計時間 | テナント全体の当月打刻時間合計（時間:分） |
| トップカテゴリ | 当月最も時間を使った業務カテゴリ名 |
| 今日の記録数 | テナント全体の本日打刻件数 |

#### 円グラフ（CategoryPieChart）
- 当月のカテゴリ別時間分布
- Recharts `PieChart` で描画

#### 棒グラフ（DailyBarChart）
- 過去7日間の日別合計時間
- Recharts `BarChart` で描画

#### 直近の記録（RecentLogs）
- テナント全体の直近20件の打刻ログ
- スタッフ名、カテゴリ名、開始時刻、終了時刻、所要時間を表示

### 5.5 メンバー管理 (`/dashboard/members`)

**概要:** テナントに所属するメンバーの一覧と追加

**一覧表示:** ID、氏名、メールアドレス、ロール、登録日

**メンバー追加（AddMemberDialog）:**
- 氏名、メールアドレス、パスワードを入力
- `service_role` で Supabase Auth にユーザー作成
- `role: "user"` で `users` テーブルに登録

### 5.6 スタッフ管理 (`/dashboard/settings/staff`)

**概要:** スタッフIDベースでユーザーを追加・管理

**一覧表示:** 氏名、スタッフID、ロール、登録日

**スタッフ追加（AddStaffDialog）:**
- 氏名、スタッフID（英数字・ハイフン・アンダースコア）、ロール、パスワードを入力
- テナント内のスタッフID重複チェック
- ダミーメール `{staffId}@{hospitalCode}.mieru-dummy.local` で Auth ユーザー作成
- `users` テーブルに `staff_id` 付きで登録

**アクセス制御:** 管理者（admin）のみ操作可能

### 5.7 カテゴリ管理 (`/dashboard/settings/categories`)

**概要:** 業務カテゴリの追加・有効/無効切り替え

**表示:**
- マスターカテゴリ（Level 1）でグルーピング
- 各テナントカテゴリ（Level 2）に有効/無効トグル

**カテゴリ追加（AddCategoryDialog）:**
- 親マスターカテゴリ選択
- カテゴリ名
- 表示色（カラーピッカー）

**アクセス制御:** 管理者（admin）のみ操作可能

---

## 6. 認証・認可

### 6.1 認証方式

| 方式 | 対象 | ログインID | 備考 |
|------|------|-----------|------|
| メール認証 | 管理者 | 実メールアドレス | 新規登録画面で作成 |
| スタッフID認証 | スタッフ | スタッフID + 病院コード | ダミーメールに変換して Supabase Auth で認証 |

### 6.2 ダミーメール方式

スタッフが個人メールアドレスを持たない運用を想定し、スタッフIDと病院コードからダミーメールを生成する。

```
ダミーメール = {staffId}@{hospitalCode}.mieru-dummy.local
```

例: スタッフID `nurse001`、病院コード `abc12345` → `nurse001@abc12345.mieru-dummy.local`

### 6.3 認可（アクセス制御）

| リソース | admin | user |
|---------|-------|------|
| ダッシュボード | ○ | ○ |
| 打刻画面 | ○ | ○ |
| メンバー一覧 | ○ | ○ |
| スタッフ追加 | ○ | × |
| カテゴリ追加/切替 | ○ | × |

### 6.4 セキュリティ

- **RLS (Row Level Security):** テナント間のデータ完全分離
- **service_role キー:** サーバーサイドのみで使用（管理操作用）
- **ミドルウェア:** 未認証ユーザーを `/login` にリダイレクト
- **Cookie セッション:** HTTP-only で安全なセッション管理

---

## 7. Server Actions 一覧

### 7.1 認証 (`actions/auth.ts`)

| 関数 | 引数 | 説明 |
|------|------|------|
| `signup` | FormData (hospitalName, name, email, password) | 病院＋管理者の新規登録 |
| `login` | FormData (hospitalCode?, loginId, password) | ハイブリッドログイン |
| `logout` | なし | ログアウト |

### 7.2 打刻 (`actions/tracker.ts`)

| 関数 | 引数 | 説明 |
|------|------|------|
| `startTracking` | なし | 打刻開始（time_logs に INSERT） |
| `stopTracking` | logId, categoryId | 打刻終了（end_time, duration, category 更新） |
| `getTodayLogs` | なし | 今日の完了済みログ一覧（JST基準） |
| `getActiveLog` | なし | 進行中の打刻を取得 |

### 7.3 ダッシュボード (`actions/dashboard.ts`)

| 関数 | 引数 | 説明 |
|------|------|------|
| `getKpiData` | なし | 今日/今月の合計時間、トップカテゴリ、記録数 |
| `getCategoryBreakdown` | なし | 当月カテゴリ別時間集計（円グラフ用） |
| `getDailyTotals` | なし | 過去7日間の日別合計（棒グラフ用） |
| `getRecentLogs` | なし | テナント全体の直近20件 |

### 7.4 カテゴリ (`actions/categories.ts`)

| 関数 | 引数 | 説明 |
|------|------|------|
| `getMasterCategories` | なし | 全マスターカテゴリ取得 |
| `getTenantCategories` | なし | テナント独自カテゴリ取得 |
| `getActiveTenantCategories` | なし | 有効なカテゴリのみ（打刻画面用） |
| `addTenantCategory` | name, masterCategoryId, color | カテゴリ追加（admin のみ） |
| `toggleTenantCategory` | categoryId, isActive | 有効/無効切り替え（admin のみ） |
| `seedTenantCategories` | なし | デフォルトカテゴリ自動投入 |

### 7.5 スタッフ (`actions/staff.ts`)

| 関数 | 引数 | 説明 |
|------|------|------|
| `getStaffList` | なし | テナント内スタッフ一覧 |
| `addStaff` | FormData (name, staffId, role, password) | スタッフ追加（admin のみ） |

### 7.6 メンバー (`actions/members.ts`)

| 関数 | 引数 | 説明 |
|------|------|------|
| `getMembers` | なし | テナント内メンバー一覧 |
| `addMember` | FormData (name, email, password) | メンバー追加（admin のみ） |

---

## 8. 日時処理

全ての日時は **JST（日本標準時 UTC+9）** を基準に計算される。

- サーバー/DB には UTC で格納
- 「今日」の判定: JST 00:00:00 を UTC に変換して比較
- 「今月」の判定: JST 月初を UTC に変換して比較
- 表示フォーマット: `HH:mm`（時刻）、`MM/DD`（日付）

---

## 9. 実装状況

### 9.1 完了済み機能

| 機能 | 状態 |
|------|------|
| マルチテナントアーキテクチャ（RLS） | 完了 |
| ハイブリッド認証（メール＋スタッフID） | 完了 |
| 打刻機能（開始/停止/カテゴリ選択） | 完了 |
| ダッシュボード（KPI/チャート/履歴） | 完了 |
| スタッフ管理（スタッフID方式） | 完了 |
| メンバー管理（メール方式） | 完了 |
| カテゴリ管理（2階層/追加/有効無効） | 完了 |
| デフォルトカテゴリ自動投入 | 完了 |
| モバイル対応 UI | 完了 |

### 9.2 未実装・計画中の機能

| 機能 | 状態 | 備考 |
|------|------|------|
| Stripe 決済（従量課金） | 未実装 | DB に stripe 関連カラムは存在 |
| メール認証・パスワードリセット | 未実装 | |
| データエクスポート（CSV/Excel） | 未実装 | |
| 期間指定のレポート | 未実装 | 現在は当月/7日間固定 |
| ユーザー削除・編集 | 未実装 | |
| カテゴリ削除・編集 | 未実装 | 有効/無効切り替えのみ |
| ロールベースのルーティングガード | 部分実装 | Server Action 内でチェック、画面レベルは未対応 |
| テスト | 未実装 | |
| CI/CD | 未実装 | |

---

## 10. 環境変数

| 変数名 | 用途 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー（RLS 適用） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（RLS バイパス） |

---

## 11. Git コミット履歴

| コミット | 内容 |
|---------|------|
| `67699ac` | ハイブリッド認証（管理者メール＆スタッフID）の実装 |
| `a0bc04b` | カテゴリの並び順固定と、患者対応のカテゴリ移動 |
| `c615b60` | 業務カテゴリの2階層化（ベンチマーク対応）を追加 |
| `8c5c5ad` | 認証・打刻・ダッシュボード・メンバー管理の全機能実装 |
| `b22e99f` | 初回コミット |
