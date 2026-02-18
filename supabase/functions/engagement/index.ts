import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type JsonRecord = Record<string, unknown>;

type EngagementRequest = {
  action?: string;
  pageSlug?: string;
  visitorId?: string;
  like?: boolean;
  commentText?: string;
  commentId?: string | number;
  reason?: string;
  honeypot?: string;
  turnstileToken?: string;
};

const json = (payload: JsonRecord, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });

const sanitizeText = (value: unknown, max = 300) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const sanitizeMultiline = (value: unknown, max = 1200) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const getClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

const verifyTurnstile = async (req: Request, token: string) => {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY") || "";
  if (!secret) {
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false, error: "Missing bot verification token." };
  }

  const ipHeader = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
  const remoteIp = ipHeader.split(",")[0]?.trim() || "";

  const formData = new URLSearchParams();
  formData.set("secret", secret);
  formData.set("response", token);
  if (remoteIp) formData.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData
  });

  const payload = (await response.json().catch(() => ({}))) as { success?: boolean; [k: string]: unknown };

  if (!payload.success) {
    return { success: false, error: "Bot verification failed." };
  }

  return { success: true, skipped: false };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  let body: EngagementRequest;
  try {
    body = (await req.json()) as EngagementRequest;
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, 400);
  }

  const action = sanitizeText(body.action, 60);
  const pageSlug = sanitizeText(body.pageSlug, 300);
  const visitorId = sanitizeText(body.visitorId, 200);

  if (!action) {
    return json({ ok: false, error: "Missing action." }, 400);
  }

  if (action !== "health" && (!pageSlug || !visitorId)) {
    return json({ ok: false, error: "Missing pageSlug or visitorId." }, 400);
  }

  let admin;
  try {
    admin = getClient();
  } catch (error) {
    return json({ ok: false, error: (error as Error).message }, 500);
  }

  try {
    if (action === "health") {
      return json({ ok: true, mode: "edge" });
    }

    if (action === "toggleLike") {
      const desiredLike = Boolean(body.like);

      if (desiredLike) {
        const { error } = await admin.from("page_likes").insert({
          page_slug: pageSlug,
          visitor_id: visitorId
        });

        if (error && error.code !== "23505") {
          return json({ ok: false, error: "Unable to save like." }, 500);
        }
      } else {
        const { error } = await admin
          .from("page_likes")
          .delete()
          .eq("page_slug", pageSlug)
          .eq("visitor_id", visitorId);

        if (error) {
          return json({ ok: false, error: "Unable to remove like." }, 500);
        }
      }

      const { count, error: countError } = await admin
        .from("page_likes")
        .select("id", { count: "exact", head: true })
        .eq("page_slug", pageSlug);

      if (countError) {
        return json({ ok: false, error: "Unable to count likes." }, 500);
      }

      return json({
        ok: true,
        liked: desiredLike,
        likes: count ?? 0
      });
    }

    if (action === "postComment") {
      const honeypot = sanitizeText(body.honeypot, 200);
      if (honeypot) {
        return json({ ok: true, comment: null, dropped: true });
      }

      const commentText = sanitizeMultiline(body.commentText, 1200);
      if (commentText.length < 3) {
        return json({ ok: false, error: "Comment must be at least 3 characters." }, 400);
      }

      const verification = await verifyTurnstile(req, sanitizeText(body.turnstileToken, 3000));
      if (!verification.success) {
        return json({ ok: false, error: verification.error ?? "Verification failed." }, 400);
      }

      const rateSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count: recentCount, error: rateError } = await admin
        .from("page_comments")
        .select("id", { count: "exact", head: true })
        .eq("visitor_id", visitorId)
        .gte("created_at", rateSince);

      if (rateError) {
        return json({ ok: false, error: "Unable to validate rate limit." }, 500);
      }

      if ((recentCount ?? 0) >= 5) {
        return json({ ok: false, error: "Posting too fast. Please wait a few minutes." }, 429);
      }

      const { data, error } = await admin
        .from("page_comments")
        .insert({
          page_slug: pageSlug,
          comment_text: commentText,
          visitor_id: visitorId
        })
        .select("id, comment_text, created_at")
        .single();

      if (error || !data) {
        return json({ ok: false, error: "Unable to post comment." }, 500);
      }

      return json({
        ok: true,
        comment: {
          id: data.id,
          text: data.comment_text,
          createdAt: data.created_at
        }
      });
    }

    if (action === "reportComment") {
      const commentId = Number(body.commentId);
      if (!Number.isFinite(commentId) || commentId <= 0) {
        return json({ ok: false, error: "Invalid comment id." }, 400);
      }

      const reason = sanitizeText(body.reason, 300) || "community-flag";

      const { data: foundComment, error: foundError } = await admin
        .from("page_comments")
        .select("id")
        .eq("id", commentId)
        .eq("page_slug", pageSlug)
        .maybeSingle();

      if (foundError) {
        return json({ ok: false, error: "Unable to check comment." }, 500);
      }

      if (!foundComment) {
        return json({ ok: false, error: "Comment not found." }, 404);
      }

      const { error } = await admin.from("comment_reports").insert({
        comment_id: commentId,
        page_slug: pageSlug,
        visitor_id: visitorId,
        reason
      });

      if (error && error.code !== "23505") {
        return json({ ok: false, error: "Unable to submit report." }, 500);
      }

      return json({ ok: true });
    }

    return json({ ok: false, error: "Unsupported action." }, 400);
  } catch {
    return json({ ok: false, error: "Unexpected server error." }, 500);
  }
});
