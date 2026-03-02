export async function sendWhatsAppMessage(phone, orderName, customerName) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("❌ WhatsApp credentials missing in .env");
    return;
  }

  const formattedPhone = phone.replace(/\D/g, "");
  console.log("📤 Sending WhatsApp to:", formattedPhone);

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
          type: "template",
          template: {
            name: "hello_world",
            language: {
              code: "en_US"
            }
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ WhatsApp API Error:", JSON.stringify(data, null, 2));
    } else {
      console.log("✅ WhatsApp message sent to:", formattedPhone);
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error);
  }
}
