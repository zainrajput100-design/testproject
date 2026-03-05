import prisma from "./db.server.js";

export async function sendAbandonedCartMessages() {
  try {
    const settings = await prisma.settings.findFirst();
    const enabled = settings?.abandonedCartEnabled ?? false;

    console.log("🛒 Abandoned cart check - enabled:", enabled);
    console.log("🛒 All settings:", JSON.stringify(settings, null, 2));

    if (!enabled) {
      console.log("⚠️ Abandoned cart is disabled in settings");
      return;
    }

    const delayMinutes = settings?.abandonedCartDelay ?? 60;
    console.log("⏱️ Delay minutes:", delayMinutes);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Build where clause
    const whereClause = {
    messageSent: false,
    phone: { not: "" },
    createdAt: { gt: oneDayAgo },
    };

    // Only add time filter if delay > 0
    if (delayMinutes > 0) {
      const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000);
      whereClause.createdAt = { lt: cutoffTime };
    }

    console.log("🔍 Query:", JSON.stringify(whereClause, null, 2));

    const carts = await prisma.abandonedCart.findMany({
      where: whereClause,
      take: 10
    });

    console.log(`📊 Found ${carts.length} abandoned carts to message`);
    console.log("🛒 Carts:", JSON.stringify(carts, null, 2));

    for (const cart of carts) {
      try {
        const messageTemplate = settings?.abandonedCartMessage ||
          "Hi {customerName}! 🛒 You left something in your cart!\n\nItems: {items}\nTotal: {total}\n\nComplete your order here: {checkoutUrl}\n\nZantac Solution";

        const message = messageTemplate
          .replace("{customerName}", cart.customerName)
          .replace("{items}", cart.items)
          .replace("{total}", cart.total)
          .replace("{checkoutUrl}", cart.checkoutUrl || "https://zantacsolution.myshopify.com");

        const token = settings?.whatsappToken || process.env.WHATSAPP_TOKEN;
        const phoneNumberId = settings?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
        const formattedPhone = cart.phone.replace(/\D/g, "");

        console.log("📤 Sending to:", formattedPhone);
        console.log("📝 Message:", message);
        console.log("🔑 Using phoneNumberId:", phoneNumberId);

        const response = await fetch(
          `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: formattedPhone,
              type: "text",
              text: { body: message }
            }),
          }
        );

        const data = await response.json();
        console.log("📊 API Response:", JSON.stringify(data, null, 2));

        if (response.ok) {
          await prisma.abandonedCart.update({
            where: { id: cart.id },
            data: { messageSent: true, sentAt: new Date() }
          });
          console.log(`✅ Abandoned cart message sent to: ${formattedPhone}`);

          await prisma.messageLog.create({
            data: {
              shop: cart.shop,
              orderName: `Cart-${cart.cartToken.slice(0, 8)}`,
              customerName: cart.customerName,
              phone: cart.phone,
              messageType: "abandoned_cart",
              status: "sent"
            }
          });
        } else {
          console.error("❌ Failed to send:", JSON.stringify(data, null, 2));
          await prisma.messageLog.create({
            data: {
              shop: cart.shop,
              orderName: `Cart-${cart.cartToken.slice(0, 8)}`,
              customerName: cart.customerName,
              phone: cart.phone,
              messageType: "abandoned_cart",
              status: "failed"
            }
          });
        }
      } catch (error) {
        console.error("❌ Error sending to cart:", cart.id, error);
      }
    }
  } catch (error) {
    console.error("❌ Abandoned cart error:", error);
  }
}
