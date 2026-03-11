import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/utils/drizzle/db";
import { subscriptions, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// Lemon Squeezy subscription status → our internal status mapping
type LsStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due"
  | "trialing"
  | "paused"
  | "unpaid";

function mapStatus(lsStatus: LsStatus): string {
  const map: Record<LsStatus, string> = {
    active: "active",
    cancelled: "cancelled",
    expired: "cancelled",
    past_due: "past_due",
    trialing: "trialing",
    paused: "cancelled",
    unpaid: "past_due",
  };
  return map[lsStatus] ?? "cancelled";
}

function mapTier(variantName: string): string {
  const name = (variantName ?? "").toLowerCase();
  if (name.includes("yearly") || name.includes("annual")) return "pro_yearly";
  return "pro_monthly";
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") ?? "";
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Verify HMAC-SHA256 signature using constant-time comparison
  const hmac = createHmac("sha256", secret);
  const expectedHex = hmac.update(rawBody).digest("hex");

  // Constant-time string comparison (hex strings are always equal length for same algorithm)
  if (expectedHex.length !== signature.length) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName: string = payload.meta?.event_name ?? "";
  const data = payload.data?.attributes ?? {};
  const lsSubscriptionId = String(payload.data?.id ?? "");
  const lsCustomerId = String(data.customer_id ?? "");
  // user_id must be passed as custom_data when creating the checkout
  const userId: string | undefined = payload.meta?.custom_data?.user_id;

  if (!userId) {
    // Event without a user_id — acknowledge without processing
    return NextResponse.json({ received: true });
  }

  const now = new Date().toISOString();

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_unpaused": {
      const status = mapStatus(data.status as LsStatus);
      const tier = mapTier(data.variant_name ?? "");
      const currentPeriodStart = data.created_at
        ? new Date(data.created_at).toISOString()
        : null;
      const currentPeriodEnd = data.renews_at
        ? new Date(data.renews_at).toISOString()
        : data.ends_at
          ? new Date(data.ends_at).toISOString()
          : null;

      await db
        .insert(subscriptions)
        .values({
          userId,
          tier,
          status,
          lsCustomerId,
          lsSubscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscriptions.lsSubscriptionId,
          set: { tier, status, lsCustomerId, currentPeriodStart, currentPeriodEnd, updatedAt: now },
        });

      await db
        .update(users)
        .set({ subscriptionTier: tier, updatedAt: now })
        .where(eq(users.id, userId));
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_paused": {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
        .where(eq(subscriptions.lsSubscriptionId, lsSubscriptionId));

      await db
        .update(users)
        .set({ subscriptionTier: "free", updatedAt: now })
        .where(eq(users.id, userId));
      break;
    }

    case "subscription_payment_failed": {
      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: now })
        .where(eq(subscriptions.lsSubscriptionId, lsSubscriptionId));
      break;
    }

    default:
      // Unhandled event — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
