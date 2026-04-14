import { NextResponse, type NextRequest } from "next/server";

// ─── Basic 認証（メディヴァ社内アクセス制御） ─────────────
function checkBasicAuth(request: NextRequest): NextResponse | null {
  const user = process.env.MEDIVA_ADMIN_USER;
  const pass = process.env.MEDIVA_ADMIN_PASS;

  // 環境変数が未設定なら Basic 認証をスキップ（開発時の利便性）
  if (!user || !pass) return null;

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [u, p] = decoded.split(":");
      if (u === user && p === pass) {
        return null; // 認証OK
      }
    }
  }

  // 認証失敗 → 401 を返す
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="MIERU Admin"',
    },
  });
}

export async function middleware(request: NextRequest) {
  // 1. Basic 認証チェック（全ページ共通）
  const basicAuthResponse = checkBasicAuth(request);
  if (basicAuthResponse) return basicAuthResponse;

  // 2. そのまま通過（Supabase セッション管理は不要になった）
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
