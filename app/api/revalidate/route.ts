import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { WebhookPayload } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const payload: WebhookPayload = JSON.parse(body);

    // ===== VERIFY GITHUB SIGNATURE =====
    const signature = request.headers.get('x-hub-signature-256');
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(body).digest('hex');

      // Secure comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      );

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('⚠️ No webhook secret configured');
    }

    // ===== PROCESS WEBHOOK =====
    const event = request.headers.get('x-github-event');

    console.log('📨 Webhook received:', {
      event,
      ref: payload.ref,
      commits: payload.commits?.length || 0,
    });

    // Only process push to main
    if (event !== 'push' || payload.ref !== 'refs/heads/main') {
      return NextResponse.json({
        message: 'Ignored: Not a push to main branch',
        event,
        ref: payload.ref,
      });
    }

    // ===== DETECT CHANGED FILES =====
    const changedFiles = new Set<string>();
    (payload.commits || []).forEach((commit) => {
      [...(commit.added || []), ...(commit.modified || []), ...(commit.removed || [])]
        .forEach((file) => changedFiles.add(file));
    });

    console.log('📂 Changed files:', Array.from(changedFiles));

    // ===== DETERMINE PATHS TO REVALIDATE =====
    const pathsToRevalidate = new Set<string>();

    changedFiles.forEach((file) => {
      // If any article changed
      if (file.startsWith('content/articles/')) {
        // Revalidate articles list
        pathsToRevalidate.add('/articles');
        pathsToRevalidate.add('/'); // Home page shows latest articles

        // Revalidate specific article page
        const slug = file.replace('content/articles/', '').replace('.md', '');
        pathsToRevalidate.add(`/articles/${slug}`);

        console.log(`📄 Article detected: ${slug}`);
      }
    });

    // ===== REVALIDATE PATHS =====
    const revalidated: string[] = [];

    for (const path of pathsToRevalidate) {
      try {
        revalidatePath(path);
        revalidated.push(path);
        console.log(`✅ Revalidated: ${path}`);
      } catch (error) {
        console.error(`❌ Failed to revalidate ${path}:`, error);
      }
    }

    // ===== RETURN SUCCESS =====
    return NextResponse.json({
      success: true,
      revalidated,
      changedFiles: Array.from(changedFiles),
      timestamp: new Date().toISOString(),
      message: `Successfully revalidated ${revalidated.length} path(s)`,
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Revalidation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Test endpoint (GET request)
export async function GET() {
  return NextResponse.json({
    message: '🎣 GitHub Webhook Endpoint',
    status: 'active',
    info: {
      acceptsPost: true,
      verifiesSignature: !!process.env.GITHUB_WEBHOOK_SECRET,
      revalidatesOnPush: true,
    },
  });
}