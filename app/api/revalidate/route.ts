import { revalidatePath, revalidateTag } from "next/cache";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { WebhookPayload } from "@/app/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload: WebhookPayload = JSON.parse(body);

    // ===== VERIFY GITHUB SIGNATURE =====
    const signature = request.headers.get("x-hub-signature-256");
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = "sha256=" + hmac.update(body).digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      );

      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // ===== PROCESS WEBHOOK =====
    const event = request.headers.get("x-github-event");

    if (event !== "push" || payload.ref !== "refs/heads/main") {
      return NextResponse.json({
        message: "Ignored: Not a push to main branch",
        event,
        ref: payload.ref,
      });
    }

    // ✅ Always revalidate global caches
    revalidateTag("articles", "default");
    revalidateTag("tags", "default");

    // ===== DETECT CHANGED FILES =====
    const changedFiles = new Set<string>();
    (payload.commits || []).forEach((commit) => {
      [
        ...(commit.added || []),
        ...(commit.modified || []),
        ...(commit.removed || []),
      ].forEach((file) => changedFiles.add(file));
    });

    const revalidated: string[] = ["tag:articles", "tag:tags"];
    const pathsToRevalidate = new Set<string>();

    // ===== PER-SLUG REVALIDATION =====
    changedFiles.forEach((file) => {
      if (!file.startsWith("content/articles/") || !file.endsWith(".md")) return;

      const slug = file.replace("content/articles/", "").replace(".md", "");

      revalidateTag(`article:${slug}`, "default");
      revalidated.push(`tag:article:${slug}`);

      // optional page cache refresh
      pathsToRevalidate.add("/articles");
      pathsToRevalidate.add("/");
      pathsToRevalidate.add(`/articles/${slug}`);
    });

    // ===== OPTIONAL: PATH REVALIDATION =====
    for (const p of pathsToRevalidate) {
      revalidatePath(p, "page");
      revalidated.push(`path:${p}`);
    }

    return NextResponse.json({
      success: true,
      revalidated,
      changedFiles: Array.from(changedFiles),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Revalidation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "GitHub Webhook Endpoint",
    status: "active",
  });
}
