import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  console.log("🔍 Webhook verification:", { mode, token });

  if (mode === "subscribe" && token === "zantac_verify_token_123") {
    console.log("✅ WhatsApp webhook verified!");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
};

export const action = async ({ request }) => {
  const body = await request.json();
  console.log("📨 WhatsApp webhook received:", JSON.stringify(body, null, 2));

  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return new Response("ok", { status: 200 });
    }

    const message = messages[0];
    const phone = message.from;
    const messageType = message.type;

    if (messageType === "interactive" && message.interactive?.type === "button_reply") {
      const buttonId = message.interactive.button_reply.id;
      console.log("🔘 Button clicked:", buttonId, "by:", phone);

      const isConfirm = buttonId.startsWith("confirm_");
      const orderName = buttonId.replace("confirm_", "").replace("cancel_", "");
      const response = isConfirm ? "confirmed" : "cancelled";
      const contactName = value?.contacts?.[0]?.profile?.name || phone;

     await prisma.orderResponse.create({
    data: {
    shop: "zantacsolution.myshopify.com",
    orderName: orderName,
    customerName: contactName,
    phone: phone,
    response: response,
  }
})

      console.log(`✅ Order ${orderName} ${response} by ${phone}`);

      const replyMessage = isConfirm
        ? `✅ Thank you! Your order ${orderName} has been confirmed. We will process it shortly!`
        : `❌ Your order ${orderName} has been cancelled as requested. Contact us if you need help.`;

      const waToken = process.env.WHATSAPP_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: replyMessage }
        }),
      });
    }

  } catch (error) {
    console.error("❌ WhatsApp webhook error:", error);
  }

  return new Response("ok", { status: 200 });
};
