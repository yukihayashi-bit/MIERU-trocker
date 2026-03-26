# 勤務時間計測（タイムスタディ）SaaS プロジェクト仕様書

## 1. プロジェクト概要
看護師をメインターゲットとした、SaaS型の勤務時間計測（タイムスタディ）アプリケーション。
スマートフォンでのリアルタイム打刻（開始・停止）を主軸とし、看護管理者はPCからスタッフの勤務割合や業務時間を分析できる。

## 2. 技術スタック
- フロントエンド: Next.js (App Router), React, TypeScript
- スタイリング: Tailwind CSS, shadcn/ui
- バックエンド/DB/認証: Supabase (PostgreSQL)
- 決済: Stripe（ユーザー数に応じた従量課金 / Per-seat billing）
- ホスティング: Vercel

## 3. アーキテクチャとセキュリティ要件（最重要）
- **マルチテナントアーキテクチャ**: 医療系データであるため、各病院（テナント）のデータ分離を徹底する。
- データベースの全操作テーブルには必ず `tenant_id` を持たせ、SupabaseのRow Level Security (RLS) を用いて、別テナントのデータへのアクセスをDBレベルで完全に遮断すること。

## 4. データベーススキーマ（基本構成）
以下のテーブル構成をベースとする。

1. `tenants` (病院マスタ)
   - id (UUID), name, stripe_customer_id, stripe_subscription_id, status, created_at
2. `users` (スタッフ・管理者)
   - id (UUID - Supabase Authと連携), tenant_id, role (admin | user), name, created_at
3. `task_categories` (業務カテゴリ)
   - id (UUID), name, is_standard (boolean - trueなら全病院共通の標準カテゴリ), tenant_id (独自追加カテゴリの場合のみセット), created_at
4. `time_logs` (打刻データ)
   - id (UUID), user_id, tenant_id, category_id, start_time, end_time, duration_seconds, created_at

## 5. 開発の基本ルール
- モバイルファースト: 打刻画面（一般ユーザー用）はスマートフォンでの操作性を最優先したUIにすること。ストップウォッチのような直感的な操作を想定する。
- コンポーネント設計: Server Components (RSC) をデフォルトとし、状態管理やイベントハンドラが必要な箇所のみ Client Components (`"use client"`) を使用する。
- データフェッチ: Next.jsのServer ActionsとSupabaseのサーバーサイドクライアントを活用する。
