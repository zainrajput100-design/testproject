import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  const settings = await prisma.settings.findFirst();
  
  return {
    settings: settings || {
      whatsappToken: "",
      phoneNumberId: "",
      orderConfirmationMessage: "Order Confirmed! Hello {customerName}! Order ID: {orderName}. Items: {items}. Total: {total}. Payment: Cash on Delivery. Thank you for shopping with Zantac Solution!",
      orderConfirmationEnabled: true,
    }
  };
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  
  const formData = await request.formData();
  
  const data = {
    whatsappToken: formData.get("whatsappToken"),
    phoneNumberId: formData.get("phoneNumberId"),
    orderConfirmationMessage: formData.get("orderConfirmationMessage"),
    orderConfirmationEnabled: formData.get("orderConfirmationEnabled") === "true",
  };
  
  const existing = await prisma.settings.findFirst();
  
  if (existing) {
    await prisma.settings.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.settings.create({ data });
  }
  
  return { success: true };
};

export default function Settings() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  
  const [token, setToken] = useState(settings.whatsappToken || "");
  const [phoneId, setPhoneId] = useState(settings.phoneNumberId || "");
  const [message, setMessage] = useState(settings.orderConfirmationMessage || "");
  const [enabled, setEnabled] = useState(settings.orderConfirmationEnabled ?? true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (fetcher.data?.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }, [fetcher.data]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
        ⚙️ WhatsApp Settings
      </h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Configure your WhatsApp Business API settings
      </p>

      {saved && (
        <div style={{ background: "#d4edda", border: "1px solid #c3e6cb", color: "#155724", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
          ✅ Settings saved successfully!
        </div>
      )}

      <fetcher.Form method="post">
        
        {/* API Settings */}
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
            📱 WhatsApp API Settings
          </h2>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>
              WhatsApp Token
            </label>
            <input
              name="whatsappToken"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="EAARb5Bkn2hoBQ..."
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>
              Phone Number ID
            </label>
            <input
              name="phoneNumberId"
              type="text"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              placeholder="998531296678803"
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Order Confirmation */}
        <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
              🛍️ Order Confirmation Message
            </h2>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="orderConfirmationEnabled"
                value="true"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>Enabled</span>
            </label>
          </div>

          <div style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "6px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#666" }}>
            <strong>Available variables:</strong><br/>
            <code>{"{customerName}"}</code> — Customer first name<br/>
            <code>{"{orderName}"}</code> — Order ID (e.g. #1001)<br/>
            <code>{"{items}"}</code> — Ordered items<br/>
            <code>{"{total}"}</code> — Order total<br/>
            <code>{"{address}"}</code> — Delivery address
          </div>

          <textarea
            name="orderConfirmationMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }}
          />

          <div style={{ marginTop: "12px", background: "#f0f7ff", border: "1px solid #b8d9f8", borderRadius: "6px", padding: "12px", fontSize: "13px" }}>
            <strong>Preview:</strong><br/>
            {message
              .replace("{customerName}", "Zain")
              .replace("{orderName}", "#1001")
              .replace("{items}", "Ski Wax x1")
              .replace("{total}", "PKR 500")
              .replace("{address}", "Karachi")}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          style={{ background: "#008060", color: "white", border: "none", padding: "12px 32px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", width: "100%" }}
        >
          {fetcher.state === "submitting" ? "Saving..." : "💾 Save Settings"}
        </button>

      </fetcher.Form>
    </div>
  );
}