import { NextResponse } from "next/server";
import { getAllArticles } from "@/app/lib/articles";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = await getAllArticles();
    return NextResponse.json({
      ok: true,
      count: articles.length,
      slugs: articles.slice(0, 5).map((a) => a.slug),
      env: {
        owner: !!process.env.GITHUB_OWNER,
        repo: !!process.env.GITHUB_REPO,
        branch: !!process.env.GITHUB_BRANCH,
        token: !!process.env.GITHUB_TOKEN,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}
