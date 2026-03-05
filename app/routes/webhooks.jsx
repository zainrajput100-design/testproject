// import { authenticate } from "../shopify.server";
// import { sendWhatsAppMessage, sendFulfillmentMessage, sendCancellationMessage } from "../whatsapp.js";

// export const action = async ({ request }) => {
//   const { topic, shop, payload } = await authenticate.webhook(request);

//   console.log("🔔 Webhook received:", topic);

//   switch (topic) {
//     case "APP_UNINSTALLED":
//       console.log("App uninstalled from:", shop);
//       break;

//     case "ORDERS_CREATE": {
//       const order = payload;
//       console.log("📦 New Order:", order.name);

//       const phone =
//         order.customer?.phone ||
//         order.shipping_address?.phone ||
//         order.billing_address?.phone;

//       const customerName = order.customer?.first_name || "Customer";
//       const orderName = order.name;

//       const items = order.line_items?.length > 0
//         ? order.line_items.map((i) => `${i.name} x${i.quantity}`).join(", ")
//         : "N/A";

//       const total = order.total_price ? `PKR ${order.total_price}` : "N/A";

//       const address = order.shipping_address
//         ? `${order.shipping_address.address1 || ""}, ${order.shipping_address.city || ""}`
//         : "Not provided";

//       console.log("📱 Phone:", phone);

//       if (phone) {
//         await sendWhatsAppMessage(phone, orderName, customerName, { items, total, address }, shop);
//       } else {
//         console.log("⚠️ No phone number found");
//       }
//       break;
//     }

//     case "ORDERS_FULFILLED": {
//       const order = payload;
//       console.log("🚚 Order Fulfilled:", order.name);

//       const phone =
//         order.customer?.phone ||
//         order.shipping_address?.phone ||
//         order.billing_address?.phone;

//       const customerName = order.customer?.first_name || "Customer";

//       if (phone) {
//         await sendFulfillmentMessage(phone, order.name, customerName, shop);
//       }
//       break;
//     }

//     case "ORDERS_CANCELLED": {
//       const order = payload;
//       console.log("🚫 Order Cancelled:", order.name);

//       const phone =
//         order.customer?.phone ||
//         order.shipping_address?.phone ||
//         order.billing_address?.phone;

//       const customerName = order.customer?.first_name || "Customer";

//       if (phone) {
//         await sendCancellationMessage(phone, order.name, customerName, shop);
//       }
//       break;
//     }

//     default:
//       console.log("Unhandled webhook topic:", topic);
//   }

//   return new Response("OK", { status: 200 });
// };


//------------Check Out ----------

import { authenticate } from "../shopify.server";
import { sendWhatsAppMessage, sendFulfillmentMessage, sendCancellationMessage, sendAdminNotification } from "../whatsapp.js";

import prisma from "../db.server";

// Track active timers to prevent duplicate messages for same cart
const activeTimers = new Set();

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("🔔 Webhook received:", topic);

  switch (topic) {
    case "APP_UNINSTALLED":
      console.log("App uninstalled from:", shop);
      break;

    case "ORDERS_CREATE": {
      const order = payload;
      console.log("📦 New Order:", order.name);

      const phone =
        order.customer?.phone ||
        order.shipping_address?.phone ||
        order.billing_address?.phone;

      const customerName = order.customer?.first_name || "Customer";
      const orderName = order.name;

      const items = order.line_items?.length > 0
        ? order.line_items.map((i) => `${i.name} x${i.quantity}`).join(", ")
        : "N/A";

      const total = order.total_price ? `PKR ${order.total_price}` : "N/A";

      const address = order.shipping_address
        ? `${order.shipping_address.address1 || ""}, ${order.shipping_address.city || ""}`
        : "Not provided";

      console.log("📱 Phone:", phone);

      if (phone) {
        await sendWhatsAppMessage(phone, orderName, customerName, { items, total, address }, shop);
        await sendAdminNotification(orderName, customerName, phone || "N/A", { items, total, address }, shop);

      } else {
        console.log("⚠️ No phone number found");
      }

      // Mark abandoned cart as recovered so no message is sent
      if (phone) {
        const formattedPhone = phone.replace(/\D/g, "");
        await prisma.abandonedCart.updateMany({
          where: { phone: { contains: formattedPhone }, messageSent: false },
          data: { messageSent: true }
        });
        console.log("✅ Marked abandoned carts as recovered for:", formattedPhone);
      }
      break;
    }

    case "ORDERS_FULFILLED": {
      const order = payload;
      console.log("🚚 Order Fulfilled:", order.name);

      const phone =
        order.customer?.phone ||
        order.shipping_address?.phone ||
        order.billing_address?.phone;

      const customerName = order.customer?.first_name || "Customer";

      if (phone) {
        await sendFulfillmentMessage(phone, order.name, customerName, shop);
      }
      break;
    }

    case "ORDERS_CANCELLED": {
      const order = payload;
      console.log("🚫 Order Cancelled:", order.name);

      const phone =
        order.customer?.phone ||
        order.shipping_address?.phone ||
        order.billing_address?.phone;

      const customerName = order.customer?.first_name || "Customer";

      if (phone) {
        await sendCancellationMessage(phone, order.name, customerName, shop);
      }
      break;
    }

    case "CHECKOUTS_CREATE":
    case "CHECKOUTS_UPDATE": {
      const checkout = payload;
      console.log("🛒 Checkout event:", topic, checkout.token);

      const phone =
        checkout.phone ||
        checkout.shipping_address?.phone ||
        checkout.billing_address?.phone;

      const customerName = checkout.customer?.first_name ||
        checkout.shipping_address?.first_name || "Customer";

      if (!phone) {
        console.log("⚠️ No phone in checkout, skipping");
        break;
      }

      const items = checkout.line_items?.length > 0
        ? checkout.line_items.map((i) => `${i.title} x${i.quantity}`).join(", ")
        : "N/A";

      const total = checkout.total_price ? `PKR ${checkout.total_price}` : "N/A";
      const checkoutUrl = checkout.abandoned_checkout_url || "";
      const cartToken = checkout.token;

      // Save or update abandoned cart
      await prisma.abandonedCart.upsert({
        where: { cartToken },
        update: { customerName, phone, items, total, checkoutUrl, updatedAt: new Date() },
        create: { shop, cartToken, customerName, phone, items, total, checkoutUrl, messageSent: false }
      });

      console.log(`🛒 Abandoned cart saved: ${customerName} - ${phone} - ${items}`);

      // Get settings
      const settings = await prisma.settings.findFirst();
      const enabled = settings?.abandonedCartEnabled ?? false;
      const delayMinutes = settings?.abandonedCartDelay ?? 60;

      console.log(`⚙️ Abandoned cart enabled: ${enabled}, delay: ${delayMinutes} mins`);

      if (!enabled) {
        console.log("⚠️ Abandoned cart disabled in settings");
        break;
      }

      // ✅ Prevent duplicate timers for same cart token
      if (activeTimers.has(cartToken)) {
        console.log(`⏭️ Timer already active for cart: ${cartToken}, skipping duplicate`);
        break;
      }

      activeTimers.add(cartToken);
      const delayMs = delayMinutes * 60 * 1000;
      console.log(`⏱️ Timer set: ${delayMinutes} minutes (${delayMs}ms) for ${phone}`);

      // Schedule message after delay
      setTimeout(async () => {
        // Remove from active timers set
        activeTimers.delete(cartToken);

        try {
          console.log(`🔔 Timer fired for cart: ${cartToken}`);

          // Check if cart already processed or order was placed
          const updatedCart = await prisma.abandonedCart.findUnique({
            where: { cartToken }
          });

          if (!updatedCart) {
            console.log("⚠️ Cart not found, skipping");
            return;
          }

          if (updatedCart.messageSent) {
            console.log("✅ Cart already processed (order placed or message sent), skipping");
            return;
          }

          const currentSettings = await prisma.settings.findFirst();

          const messageTemplate = currentSettings?.abandonedCartMessage ||
            "Hi {customerName}! 🛒 You left something in your cart!\n\nItems: {items}\nTotal: {total}\n\nComplete your order here: {checkoutUrl}\n\nZantac Solution";

          const message = messageTemplate
            .replace("{customerName}", updatedCart.customerName)
            .replace("{items}", updatedCart.items)
            .replace("{total}", updatedCart.total)
            .replace("{checkoutUrl}", updatedCart.checkoutUrl || "https://zantacsolution.myshopify.com");

          const token = currentSettings?.whatsappToken || process.env.WHATSAPP_TOKEN;
          const phoneNumberId = currentSettings?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
          const formattedPhone = updatedCart.phone.replace(/\D/g, "");

          console.log(`📤 Sending abandoned cart to: ${formattedPhone}`);
          console.log(`📝 Message: ${message}`);

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
              where: { id: updatedCart.id },
              data: { messageSent: true, sentAt: new Date() }
            });

            await prisma.messageLog.create({
              data: {
                shop: updatedCart.shop,
                orderName: `Cart-${cartToken.slice(0, 8)}`,
                customerName: updatedCart.customerName,
                phone: updatedCart.phone,
                messageType: "abandoned_cart",
                status: "sent"
              }
            });

            console.log(`✅ Abandoned cart message sent to: ${formattedPhone}`);
          } else {
            console.error("❌ Failed to send:", JSON.stringify(data, null, 2));
            await prisma.messageLog.create({
              data: {
                shop: updatedCart.shop,
                orderName: `Cart-${cartToken.slice(0, 8)}`,
                customerName: updatedCart.customerName,
                phone: updatedCart.phone,
                messageType: "abandoned_cart",
                status: "failed"
              }
            });
          }
        } catch (error) {
          console.error("❌ Auto abandoned cart error:", error);
        }
      }, delayMs);

      break;
    }

    default:
      console.log("Unhandled webhook topic:", topic);
  }

  return new Response("OK", { status: 200 });
};
