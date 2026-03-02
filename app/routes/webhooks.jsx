import { authenticate } from "../shopify.server";
import { sendWhatsAppMessage } from "../whatsapp.js";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("🔔 Webhook received:", topic);

  switch (topic) {
    case "APP_UNINSTALLED":
      console.log("App uninstalled from:", shop);
      break;

    case "ORDERS_CREATE": {
      const order = payload;
      console.log("📦 New Order Received:", order.name);

      const phone =
        order.customer?.phone ||
        order.shipping_address?.phone ||
        order.billing_address?.phone;

      const customerName = order.customer?.first_name || "Customer";
      const orderName = order.name;

      console.log("📱 Customer Phone:", phone);

      if (phone) {
        await sendWhatsAppMessage(phone, orderName, customerName);
      } else {
        console.log("⚠️ No phone number found in order");
      }
      break;
    }

    default:
      console.log("Unhandled webhook topic:", topic);
  }

  return new Response("OK", { status: 200 });
};