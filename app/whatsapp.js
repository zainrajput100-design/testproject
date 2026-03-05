// import prisma from "./db.server.js";

// async function getCredentials() {
//   const settings = await prisma.settings.findFirst();
//   return {
//     token: settings?.whatsappToken || process.env.WHATSAPP_TOKEN,
//     phoneNumberId: settings?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID,
//   };
// }

// async function sendTemplateMessage(phone, customerName, orderName, items, total, address) {
//   const { token, phoneNumberId } = await getCredentials();

//   if (!token || !phoneNumberId) {
//     console.error("❌ WhatsApp credentials missing");
//     return false;
//   }

//   const formattedPhone = phone.replace(/\D/g, "");

//   try {
//     const response = await fetch(
//       `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           messaging_product: "whatsapp",
//           to: formattedPhone,
//           type: "template",
//           template: {
//             name: "delivery_confirmation_1",
//             language: { code: "en_US" },
//             components: [
//               {
//                 type: "body",
//                 parameters: [
//                   { type: "text", text: customerName },
//                   { type: "text", text: orderName },
//                   { type: "text", text: items },
//                   { type: "text", text: total },
//                   { type: "text", text: address },
//                 ]
//               }
//             ]
//           }
//         }),
//       }
//     );

//     const data = await response.json();
//     if (!response.ok) {
//       console.error("❌ WhatsApp API Error:", JSON.stringify(data, null, 2));
//       return false;
//     } else {
//       console.log("✅ WhatsApp message sent to:", formattedPhone);
//       console.log("📊 Response:", JSON.stringify(data, null, 2));
//       return true;
//     }
//   } catch (error) {
//     console.error("❌ Error:", error);
//     return false;
//   }
// }

// async function logMessage(shop, orderName, customerName, phone, messageType, status) {
//   try {
//     await prisma.messageLog.create({
//       data: { shop, orderName, customerName, phone, messageType, status }
//     });
//   } catch (error) {
//     console.error("❌ Error logging message:", error);
//   }
// }

// export async function sendWhatsAppMessage(phone, orderName, customerName, orderDetails, shop) {
//   const settings = await prisma.settings.findFirst();
//   const enabled = settings?.orderConfirmationEnabled ?? true;

//   if (!enabled) {
//     console.log("⚠️ Order confirmation is disabled");
//     return;
//   }

//   const items = orderDetails?.items || "N/A";
//   const total = orderDetails?.total || "N/A";
//   const address = orderDetails?.address || "N/A";

//   console.log("📤 Sending order confirmation to:", phone);
//   const success = await sendTemplateMessage(phone, customerName, orderName, items, total, address);
//   await logMessage(shop || "unknown", orderName, customerName, phone, "order_confirmation", success ? "sent" : "failed");
// }

// export async function sendFulfillmentMessage(phone, orderName, customerName, shop) {
//   console.log("🚚 Sending fulfillment notification to:", phone);
//   const success = await sendTemplateMessage(phone, customerName, orderName, "Your order", "See order", "On the way");
//   await logMessage(shop || "unknown", orderName, customerName, phone, "fulfillment", success ? "sent" : "failed");
// }

// export async function sendCancellationMessage(phone, orderName, customerName, shop) {
//   console.log("🚫 Sending cancellation notification to:", phone);
//   const success = await sendTemplateMessage(phone, customerName, orderName, "Cancelled", "N/A", "N/A");
//   await logMessage(shop || "unknown", orderName, customerName, phone, "cancellation", success ? "sent" : "failed");
// }

//--------------------Zain above code for template 1 -------------- below is for custom message-----------

// import prisma from "./db.server.js";

// async function getCredentials() {
//   const settings = await prisma.settings.findFirst();
//   return {
//     token: settings?.whatsappToken || process.env.WHATSAPP_TOKEN,
//     phoneNumberId: settings?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID,
//   };
// }

// async function sendTextMessage(phone, message) {
//   const { token, phoneNumberId } = await getCredentials();

//   if (!token || !phoneNumberId) {
//     console.error("❌ WhatsApp credentials missing");
//     return false;
//   }

//   const formattedPhone = phone.replace(/\D/g, "");

//   try {
//     const response = await fetch(
//       `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           messaging_product: "whatsapp",
//           to: formattedPhone,
//           type: "text",
//           text: { body: message }
//         }),
//       }
//     );

//     const data = await response.json();
//     if (!response.ok) {
//       console.error("❌ WhatsApp API Error:", JSON.stringify(data, null, 2));
//       return false;
//     } else {
//       console.log("✅ WhatsApp message sent to:", formattedPhone);
//       console.log("📊 Response:", JSON.stringify(data, null, 2));
//       return true;
//     }
//   } catch (error) {
//     console.error("❌ Error:", error);
//     return false;
//   }
// }

// async function logMessage(shop, orderName, customerName, phone, messageType, status) {
//   try {
//     await prisma.messageLog.create({
//       data: { shop, orderName, customerName, phone, messageType, status }
//     });
//   } catch (error) {
//     console.error("❌ Error logging message:", error);
//   }
// }

// export async function sendWhatsAppMessage(phone, orderName, customerName, orderDetails, shop) {
//   const settings = await prisma.settings.findFirst();
//   const enabled = settings?.orderConfirmationEnabled ?? true;

//   if (!enabled) {
//     console.log("⚠️ Order confirmation is disabled");
//     return;
//   }

//   const messageTemplate = settings?.orderConfirmationMessage ||
//     "Hello {customerName}! Your order {orderName} has been confirmed. Items: {items}. Total: {total}. Payment: Cash on Delivery. Delivery to: {address}. Thank you for shopping with Zantac Solution!";

//   const message = messageTemplate
//     .replace("{customerName}", customerName)
//     .replace("{orderName}", orderName)
//     .replace("{items}", orderDetails?.items || "N/A")
//     .replace("{total}", orderDetails?.total || "N/A")
//     .replace("{address}", orderDetails?.address || "N/A");

//   console.log("📤 Sending order confirmation to:", phone);
//   console.log("📝 Message:", message);

//   const success = await sendTextMessage(phone, message);
//   await logMessage(shop || "unknown", orderName, customerName, phone, "order_confirmation", success ? "sent" : "failed");
// }

// export async function sendFulfillmentMessage(phone, orderName, customerName, shop) {
//   const settings = await prisma.settings.findFirst();
//   const enabled = settings?.fulfillmentEnabled ?? true;

//   if (!enabled) {
//     console.log("⚠️ Fulfillment notification is disabled");
//     return;
//   }

//   const messageTemplate = settings?.fulfillmentMessage ||
//     "🚚 Hello {customerName}! Your order {orderName} has been fulfilled and is on its way. Estimated delivery: 2-3 business days. Thank you for shopping with Zantac Solution!";

//   const message = messageTemplate
//     .replace("{customerName}", customerName)
//     .replace("{orderName}", orderName);

//   console.log("🚚 Sending fulfillment notification to:", phone);
//   const success = await sendTextMessage(phone, message);
//   await logMessage(shop || "unknown", orderName, customerName, phone, "fulfillment", success ? "sent" : "failed");
// }

// export async function sendCancellationMessage(phone, orderName, customerName, shop) {
//   const settings = await prisma.settings.findFirst();
//   const enabled = settings?.cancellationEnabled ?? true;

//   if (!enabled) {
//     console.log("⚠️ Cancellation notification is disabled");
//     return;
//   }

//   const messageTemplate = settings?.cancellationMessage ||
//     "❌ Hello {customerName}! Your order {orderName} has been cancelled. If you have any questions please contact us. We hope to serve you again! Zantac Solution";

//   const message = messageTemplate
//     .replace("{customerName}", customerName)
//     .replace("{orderName}", orderName);

//   console.log("🚫 Sending cancellation notification to:", phone);
//   const success = await sendTextMessage(phone, message);
//   await logMessage(shop || "unknown", orderName, customerName, phone, "cancellation", success ? "sent" : "failed");
// }



//----------- lets build a poll ----------------

import prisma from "./db.server.js";

async function getCredentials() {
  const settings = await prisma.settings.findFirst();
  return {
    token: settings?.whatsappToken || process.env.WHATSAPP_TOKEN,
    phoneNumberId: settings?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID,
  };
}

async function sendTextMessage(phone, message) {
  const { token, phoneNumberId } = await getCredentials();
  const formattedPhone = phone.replace(/\D/g, "");

  try {
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
    if (!response.ok) {
      console.error("❌ WhatsApp API Error:", JSON.stringify(data, null, 2));
      return false;
    }
    console.log("✅ Text message sent to:", formattedPhone);
    return true;
  } catch (error) {
    console.error("❌ Error:", error);
    return false;
  }
}

async function sendButtonMessage(phone, orderName, customerName, items, total, address, customMessage) {
  const { token, phoneNumberId } = await getCredentials();
  const settings = await prisma.settings.findFirst();
  const formattedPhone = phone.replace(/\D/g, "");

  const confirmText = (settings?.confirmButtonText || "✅ Yes, Confirm").slice(0, 20);
  const cancelText = (settings?.cancelButtonText || "❌ No, Cancel").slice(0, 20);

  const bodyText = `${customMessage}\n\nOrder Details:\nOrder Number: ${orderName}\nItems: ${items}\nSubtotal: ${total}\nAddress: ${address}\n\nPlease confirm your order.`;

  try {
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
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: bodyText },
            action: {
              buttons: [
                { type: "reply", reply: { id: `confirm_${orderName}`, title: confirmText } },
                { type: "reply", reply: { id: `cancel_${orderName}`, title: cancelText } }
              ]
            }
          }
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("❌ WhatsApp API Error:", JSON.stringify(data, null, 2));
      return false;
    }
    console.log("✅ Button message sent to:", formattedPhone);
    return true;
  } catch (error) {
    console.error("❌ Error:", error);
    return false;
  }
}

async function logMessage(shop, orderName, customerName, phone, messageType, status) {
  try {
    await prisma.messageLog.create({
      data: { shop, orderName, customerName, phone, messageType, status }
    });
  } catch (error) {
    console.error("❌ Error logging message:", error);
  }
}

export async function sendAdminNotification(orderName, customerName, phone, orderDetails, shop) {
  try {
    const settings = await prisma.settings.findFirst();
    const enabled = settings?.adminNotificationEnabled ?? false;

    if (!enabled) {
      console.log("⚠️ Admin notification disabled");
      return;
    }

    const adminNumbersRaw = settings?.adminNumbers || "";
    const adminNumbers = adminNumbersRaw
      .split(",")
      .map(n => n.trim().replace(/\D/g, ""))
      .filter(n => n.length > 0);

    if (adminNumbers.length === 0) {
      console.log("⚠️ No admin numbers configured");
      return;
    }

    const { token, phoneNumberId } = await getCredentials();

    const messageTemplate = settings?.adminNotificationMessage ||
      "🔔 *Alert!*\n\nA new order has been placed at {shopName}!\n\n*Order Number:* {orderName}\n*Customer:* {customerName}\n*Phone:* {phone}\n*Items:* {items}\n*Total:* {total}\n*Address:* {address}";

    const message = messageTemplate
      .replace("{orderNumber}", orderName)
      .replace("{orderName}", orderName)
      .replace("{customerName}", customerName)
      .replace("{phone}", phone)
      .replace("{items}", orderDetails?.items || "N/A")
      .replace("{total}", orderDetails?.total || "N/A")
      .replace("{address}", orderDetails?.address || "N/A")
      .replace("{shopName}", shop || "Zantac Solution");

    console.log(`📢 Sending admin notification to ${adminNumbers.length} admin(s)`);

    for (const adminPhone of adminNumbers) {
      try {
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
              to: adminPhone,
              type: "text",
              text: { body: message }
            }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          console.log(`✅ Admin notification sent to: ${adminPhone}`);
        } else {
          console.error(`❌ Failed to send to admin ${adminPhone}:`, JSON.stringify(data));
        }
      } catch (err) {
        console.error(`❌ Error sending to admin ${adminPhone}:`, err);
      }
    }
  } catch (error) {
    console.error("❌ Admin notification error:", error);
  }
}

export async function sendWhatsAppMessage(phone, orderName, customerName, orderDetails, shop) {
  const settings = await prisma.settings.findFirst();
  const enabled = settings?.orderConfirmationEnabled ?? true;

  if (!enabled) {
    console.log("⚠️ Order confirmation is disabled");
    return;
  }

  const items = orderDetails?.items || "N/A";
  const total = orderDetails?.total || "N/A";
  const address = orderDetails?.address || "N/A";

  const customMessage = settings?.orderConfirmationMessage ||
    `Thank you for your order from Zantac Solution!\nHello ${customerName}!`;

  const parsedMessage = customMessage
    .replace("{customerName}", customerName)
    .replace("{orderName}", orderName)
    .replace("{items}", items)
    .replace("{total}", total)
    .replace("{address}", address);

  console.log("📤 Sending order confirmation to:", phone);
  const success = await sendButtonMessage(phone, orderName, customerName, items, total, address, parsedMessage);
  await logMessage(shop || "unknown", orderName, customerName, phone, "order_confirmation", success ? "sent" : "failed");
}

export async function sendFulfillmentMessage(phone, orderName, customerName, shop) {
  const settings = await prisma.settings.findFirst();
  const enabled = settings?.fulfillmentEnabled ?? true;

  if (!enabled) {
    console.log("⚠️ Fulfillment notification is disabled");
    return;
  }

  const messageTemplate = settings?.fulfillmentMessage ||
    "🚚 Hello {customerName}! Your order {orderName} has been fulfilled and is on its way. Estimated delivery: 2-3 business days. Thank you for shopping with Zantac Solution!";

  const message = messageTemplate
    .replace("{customerName}", customerName)
    .replace("{orderName}", orderName);

  console.log("🚚 Sending fulfillment notification to:", phone);
  const success = await sendTextMessage(phone, message);
  await logMessage(shop || "unknown", orderName, customerName, phone, "fulfillment", success ? "sent" : "failed");
}

export async function sendCancellationMessage(phone, orderName, customerName, shop) {
  const settings = await prisma.settings.findFirst();
  const enabled = settings?.cancellationEnabled ?? true;

  if (!enabled) {
    console.log("⚠️ Cancellation notification is disabled");
    return;
  }

  const messageTemplate = settings?.cancellationMessage ||
    "❌ Hello {customerName}! Your order {orderName} has been cancelled. If you have any questions please contact us. We hope to serve you again! Zantac Solution";

  const message = messageTemplate
    .replace("{customerName}", customerName)
    .replace("{orderName}", orderName);

  console.log("🚫 Sending cancellation notification to:", phone);
  const success = await sendTextMessage(phone, message);
  await logMessage(shop || "unknown", orderName, customerName, phone, "cancellation", success ? "sent" : "failed");
}