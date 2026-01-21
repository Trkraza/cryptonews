// import { revalidatePath } from 'next/cache';
// import crypto from 'crypto';
// import { NextRequest, NextResponse } from 'next/server';
// import { WebhookPayload } from '@/app/lib/types';

// export async function POST(request: NextRequest) {
//   try {
//     // Get raw body for signature verification
//     const body = await request.text();
//     const payload: WebhookPayload = JSON.parse(body);

//     // ===== VERIFY GITHUB SIGNATURE =====
//     const signature = request.headers.get('x-hub-signature-256');
//     const secret = process.env.GITHUB_WEBHOOK_SECRET;

//     if (secret && signature) {
//       const hmac = crypto.createHmac('sha256', secret);
//       const digest = 'sha256=' + hmac.update(body).digest('hex');

//       // Secure comparison
//       const isValid = crypto.timingSafeEqual(
//         Buffer.from(signature),
//         Buffer.from(digest)
//       );

//       if (!isValid) {
//         console.error('❌ Invalid webhook signature');
//         return NextResponse.json(
//           { error: 'Invalid signature' },
//           { status: 401 }
//         );
//       }
//     } else {
//       console.warn('⚠️ No webhook secret configured');
//     }

//     // ===== PROCESS WEBHOOK =====
//     const event = request.headers.get('x-github-event');

//     console.log('📨 Webhook received:', {
//       event,
//       ref: payload.ref,
//       commits: payload.commits?.length || 0,
//     });

//     // Only process push to main
//     if (event !== 'push' || payload.ref !== 'refs/heads/main') {
//       return NextResponse.json({
//         message: 'Ignored: Not a push to main branch',
//         event,
//         ref: payload.ref,
//       });
//     }

//     // ===== DETECT CHANGED FILES =====
//     const changedFiles = new Set<string>();
//     (payload.commits || []).forEach((commit) => {
//       [...(commit.added || []), ...(commit.modified || []), ...(commit.removed || [])]
//         .forEach((file) => changedFiles.add(file));
//     });

//     console.log('📂 Changed files:', Array.from(changedFiles));

//     // ===== DETERMINE PATHS TO REVALIDATE =====
//     const pathsToRevalidate = new Set<string>();

//     changedFiles.forEach((file) => {
//       // If any article changed
//       if (file.startsWith('content/articles/')) {
//         // Revalidate articles list
//         pathsToRevalidate.add('/articles');
//         pathsToRevalidate.add('/'); // Home page shows latest articles

//         // Revalidate specific article page
//         const slug = file.replace('content/articles/', '').replace('.md', '');
//         pathsToRevalidate.add(`/articles/${slug}`);

//         console.log(`📄 Article detected: ${slug}`);
//       }
//     });

//     // ===== REVALIDATE PATHS =====
//     const revalidated: string[] = [];

//     for (const path of pathsToRevalidate) {
//       try {
//         revalidatePath(path);
//         revalidated.push(path);
//         console.log(`✅ Revalidated: ${path}`);
//       } catch (error) {
//         console.error(`❌ Failed to revalidate ${path}:`, error);
//       }
//     }

//     // ===== RETURN SUCCESS =====
//     return NextResponse.json({
//       success: true,
//       revalidated,
//       changedFiles: Array.from(changedFiles),
//       timestamp: new Date().toISOString(),
//       message: `Successfully revalidated ${revalidated.length} path(s)`,
//     });

//   } catch (error) {
//     console.error('❌ Webhook processing error:', error);
//     return NextResponse.json(
//       {
//         error: 'Revalidation failed',
//         details: error instanceof Error ? error.message : 'Unknown error',
//       },
//       { status: 500 }
//     );
//   }
// }

// // Test endpoint (GET request)
// export async function GET() {
//   return NextResponse.json({
//     message: '🎣 GitHub Webhook Endpoint',
//     status: 'active',
//     info: {
//       acceptsPost: true,
//       verifiesSignature: !!process.env.GITHUB_WEBHOOK_SECRET,
//       revalidatesOnPush: true,
//     },
//   });
// }
import { revalidatePath, revalidateTag } from "next/cache";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { WebhookPayload } from "@/app/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const payload: WebhookPayload = JSON.parse(body);

    // ===== VERIFY GITHUB SIGNATURE =====
    const signature = request.headers.get("x-hub-signature-256");
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = "sha256=" + hmac.update(body).digest("hex");

      // Secure comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      );

      if (!isValid) {
        console.error("❌ Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("⚠️ No webhook secret configured");
    }

    // ===== PROCESS WEBHOOK =====
    const event = request.headers.get("x-github-event");

    console.log("📨 Webhook received:", {
      event,
      ref: payload.ref,
      commits: payload.commits?.length || 0,
    });

    // Only process push to main
    if (event !== "push" || payload.ref !== "refs/heads/main") {
      return NextResponse.json({
        message: "Ignored: Not a push to main branch",
        event,
        ref: payload.ref,
      });
    }

    // ===== DETECT CHANGED FILES =====
    const changedFiles = new Set<string>();
    (payload.commits || []).forEach((commit) => {
      [
        ...(commit.added || []),
        ...(commit.modified || []),
        ...(commit.removed || []),
      ].forEach((file) => changedFiles.add(file));
    });

    console.log("📂 Changed files:", Array.from(changedFiles));

    // ===== DETERMINE WHAT TO REVALIDATE =====
    const pathsToRevalidate = new Set<string>();
    const tagsToRevalidate = new Set<string>();

    changedFiles.forEach((file) => {
      if (file.startsWith("content/articles/")) {
        // Pages that may show article data
        pathsToRevalidate.add("/articles");
        pathsToRevalidate.add("/"); // Home page shows latest articles

        // Revalidate specific article page (path)
        const slug = file.replace("content/articles/", "").replace(".md", "");
        pathsToRevalidate.add(`/articles/${slug}`);

        // ✅ IMPORTANT: invalidate unstable_cache() data
        tagsToRevalidate.add("articles");          // lists
        tagsToRevalidate.add("tags");              // tag list (if used)
        tagsToRevalidate.add(`article:${slug}`);   // single article cache

        console.log(`📄 Article detected: ${slug}`);
      }
    });

    // ===== REVALIDATE TAGS (THIS IS THE KEY CHANGE) =====
    // revalidatePath() only affects route cache, NOT unstable_cache().
    // Since your lib uses unstable_cache(tags: ...), we MUST call revalidateTag().
    const revalidated: string[] = [];

    for (const tag of tagsToRevalidate) {
      try {
 revalidateTag(tag, "default");

        revalidated.push(`tag:${tag}`);
        console.log(`✅ Revalidated tag: ${tag}`);
      } catch (error) {
        console.error(`❌ Failed to revalidate tag ${tag}:`, error);
      }
    }

    // ===== OPTIONAL: REVALIDATE PATHS TOO =====
    // Not strictly required once tags are correct, but it's nice for page cache.
    for (const p of pathsToRevalidate) {
      try {
        revalidatePath(p);
        revalidated.push(`path:${p}`);
        console.log(`✅ Revalidated path: ${p}`);
      } catch (error) {
        console.error(`❌ Failed to revalidate path ${p}:`, error);
      }
    }

    // ===== RETURN SUCCESS =====
    return NextResponse.json({
      success: true,
      revalidated,
      changedFiles: Array.from(changedFiles),
      timestamp: new Date().toISOString(),
      message: `Successfully revalidated ${revalidated.length} item(s)`,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      {
        error: "Revalidation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Test endpoint (GET request)
export async function GET() {
  return NextResponse.json({
    message: "🎣 GitHub Webhook Endpoint",
    status: "active",
    info: {
      acceptsPost: true,
      verifiesSignature: !!process.env.GITHUB_WEBHOOK_SECRET,
      revalidatesOnPush: true,
    },

    // 🚫 IMPORTANT (your “60s” comment):
    // REMOVE time-based ISR from your pages, e.g. delete/comment these lines:
    //
    //   export const revalidate = 60;
    //   export const revalidate = 3600;
    //
    // On-demand ISR should be driven by this webhook + revalidateTag().
  });
}
