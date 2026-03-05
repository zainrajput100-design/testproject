import { sendAbandonedCartMessages } from "../abandonedCart.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== "zantac_cron_secret_123") {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("⏰ Running abandoned cart cron job...");
  await sendAbandonedCartMessages();

  return new Response("Cron job completed", { status: 200 });
};