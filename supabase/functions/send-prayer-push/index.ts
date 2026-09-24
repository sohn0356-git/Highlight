import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webPush from "npm:web-push@3.6.7";

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  subscription: any;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
      return json({ error: "Missing push environment variables" }, 500);
    }

    const { notificationId } = await req.json();
    if (!notificationId) return json({ error: "notificationId is required" }, 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, body, related_id")
      .eq("id", notificationId)
      .single();

    if (notificationError || !notification) return json({ error: "Notification not found" }, 404);

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, subscription")
      .eq("user_id", notification.user_id)
      .eq("enabled", true) as { data: PushSubscriptionRow[] | null };

    if (!subscriptions?.length) return json({ sent: 0 });

    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const payload = JSON.stringify({
      title: notification.title || "기도 알림",
      body: notification.body || "누군가 내 기도제목에 기도했어요",
      url: `/Highlight/home/?notification=${notification.id}`,
      tag: `notification-${notification.id}`,
    });

    const results = await Promise.allSettled(
      subscriptions.map((row) => webPush.sendNotification(row.subscription, payload))
    );

    const staleIds = results
      .map((result, index) => ({ result, id: subscriptions[index].id }))
      .filter(({ result }) => {
        if (result.status !== "rejected") return false;
        const statusCode = result.reason?.statusCode;
        return statusCode === 404 || statusCode === 410;
      })
      .map(({ id }) => id);

    if (staleIds.length) {
      await supabase.from("push_subscriptions").update({ enabled: false }).in("id", staleIds);
    }

    return json({
      sent: results.filter((result) => result.status === "fulfilled").length,
      stale: staleIds.length,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
