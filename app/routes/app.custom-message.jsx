import { useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const settings = await prisma.settings.findFirst();
  return { settings };
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    orderConfirmationMessage: formData.get("orderConfirmationMessage"),
    fulfillmentMessage: formData.get("fulfillmentMessage"),
    cancellationMessage: formData.get("cancellationMessage"),
    abandonedCartMessage: formData.get("abandonedCartMessage"),
    adminNotificationMessage: formData.get("adminNotificationMessage"),
    adminNumbers: formData.get("adminNumbers"),
    orderConfirmationEnabled: formData.get("orderConfirmationEnabled") === "true",
    fulfillmentEnabled: formData.get("fulfillmentEnabled") === "true",
    cancellationEnabled: formData.get("cancellationEnabled") === "true",
    abandonedCartEnabled: formData.get("abandonedCartEnabled") === "true",
    adminNotificationEnabled: formData.get("adminNotificationEnabled") === "true",
    abandonedCartDelay: parseInt(formData.get("abandonedCartDelay") || "60"),
    confirmButtonText: formData.get("confirmButtonText") || "✅ Yes, Confirm",
    cancelButtonText: formData.get("cancelButtonText") || "❌ No, Cancel",
  };

  const existing = await prisma.settings.findFirst();
  if (existing) {
    await prisma.settings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.settings.create({ data });
  }

  return { success: true };
};

export default function CustomMessage() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const currentPath = "/app/custom-message";

  const [orderMessage, setOrderMessage] = useState(settings?.orderConfirmationMessage || "Hello {customerName}! Your order {orderName} has been confirmed. Items: {items}. Total: {total}. Payment: Cash on Delivery. Delivery to: {address}. Thank you for shopping with Zantac Solution!");
  const [fulfillmentMessage, setFulfillmentMessage] = useState(settings?.fulfillmentMessage || "🚚 Hello {customerName}! Your order {orderName} has been fulfilled and is on its way. Estimated delivery: 2-3 business days. Thank you for shopping with Zantac Solution!");
  const [cancellationMessage, setCancellationMessage] = useState(settings?.cancellationMessage || "❌ Hello {customerName}! Your order {orderName} has been cancelled. If you have any questions please contact us. We hope to serve you again! Zantac Solution");
  const [abandonedCartMessage, setAbandonedCartMessage] = useState(settings?.abandonedCartMessage || "Hi {customerName}! 🛒 You left something in your cart!\n\nItems: {items}\nTotal: {total}\n\nComplete your order here: {checkoutUrl}\n\nZantac Solution");
  const [adminMessage, setAdminMessage] = useState(settings?.adminNotificationMessage || "🔔 *Alert!*\n\nA new order has been placed at {shopName}!\n\n*Order Number:* {orderName}\n*Customer:* {customerName}\n*Phone:* {phone}\n*Items:* {items}\n*Total:* {total}\n*Address:* {address}");
  const [orderEnabled, setOrderEnabled] = useState(settings?.orderConfirmationEnabled ?? true);
  const [fulfillmentEnabled, setFulfillmentEnabled] = useState(settings?.fulfillmentEnabled ?? true);
  const [cancellationEnabled, setCancellationEnabled] = useState(settings?.cancellationEnabled ?? true);
  const [abandonedCartEnabled, setAbandonedCartEnabled] = useState(settings?.abandonedCartEnabled ?? false);
  const [adminEnabled, setAdminEnabled] = useState(settings?.adminNotificationEnabled ?? false);
  const [abandonedCartDelay, setAbandonedCartDelay] = useState(settings?.abandonedCartDelay ?? 0);
  const [confirmButtonText, setConfirmButtonText] = useState(settings?.confirmButtonText || "✅ Yes, Confirm");
  const [cancelButtonText, setCancelButtonText] = useState(settings?.cancelButtonText || "❌ No, Cancel");
  const [adminNumbers, setAdminNumbers] = useState(
    settings?.adminNumbers ? settings.adminNumbers.split(",").map(n => n.trim()).filter(Boolean) : [""]
  );

  const nav = [
    { label: "📊 Dashboard", href: "/app" },
    { label: "💬 Custom Message", href: "/app/custom-message" },
    { label: "📋 Tracking Orders", href: "/app/tracking" },
    { label: "⚙️ Settings", href: "/app/settings" },
  ];

  const variables = [
    ["{customerName}", "Customer first name"],
    ["{orderName}", "Order ID e.g. #1001"],
    ["{items}", "Ordered items"],
    ["{total}", "Order total"],
    ["{address}", "Delivery address"],
  ];

  const adminVariables = [
    ["{shopName}", "Your shop name"],
    ["{orderName}", "Order ID e.g. #1001"],
    ["{customerName}", "Customer name"],
    ["{phone}", "Customer phone"],
    ["{items}", "Ordered items"],
    ["{total}", "Order total"],
    ["{address}", "Delivery address"],
  ];

  const cartVariables = [
    ["{customerName}", "Customer first name"],
    ["{items}", "Cart items"],
    ["{total}", "Cart total"],
    ["{checkoutUrl}", "Checkout link"],
  ];

  const addAdminNumber = () => setAdminNumbers([...adminNumbers, ""]);
  const removeAdminNumber = (index) => setAdminNumbers(adminNumbers.filter((_, i) => i !== index));
  const updateAdminNumber = (index, value) => {
    const updated = [...adminNumbers];
    updated[index] = value;
    setAdminNumbers(updated);
  };

  const MessageCard = ({ icon, title, desc, name, value, onChange, enabled, enabledName, onEnabledChange, color, vars }) => (
    <div style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "24px", marginBottom: "20px", borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px 0" }}>{icon} {title}</h2>
          <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>{desc}</p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input type="checkbox" name={enabledName} value="true" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#008060" }} />
          <span style={{ fontWeight: "bold", color: enabled ? "#008060" : "#666" }}>{enabled ? "Enabled" : "Disabled"}</span>
        </label>
      </div>
      <div style={{ background: "#f6f6f7", border: "1px solid #e1e3e5", borderRadius: "6px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
        <strong>Available variables:</strong>
        <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          {(vars || variables).map(([variable, desc]) => (
            <div key={variable} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <code style={{ background: "#e1e3e5", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{variable}</code>
              <span style={{ color: "#666", fontSize: "12px" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
      <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)} rows={4} disabled={!enabled}
        style={{ width: "100%", padding: "12px", border: "1px solid #e1e3e5", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical", fontFamily: "Arial", opacity: enabled ? 1 : 0.5 }} />
      <div style={{ marginTop: "12px", background: "#f0f7ff", border: "1px solid #b8d9f8", borderRadius: "6px", padding: "12px" }}>
        <strong style={{ fontSize: "13px" }}>📱 Preview:</strong>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
          {value.replace("{customerName}", "Zain").replace("{orderName}", "#1001").replace("{items}", "Ski Wax x1").replace("{total}", "PKR 500").replace("{address}", "Karachi").replace("{checkoutUrl}", "https://zantacsolution.myshopify.com/checkouts/abc123")}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "2px solid #e1e3e5", paddingBottom: "16px" }}>
        {nav.map((item) => (
          <button key={item.href} onClick={() => navigate(item.href)} style={{
            padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", fontSize: "14px",
            background: item.href === currentPath ? "#008060" : "#f6f6f7",
            color: item.href === currentPath ? "white" : "#333",
            border: item.href === currentPath ? "1px solid #008060" : "1px solid #e1e3e5", cursor: "pointer"
          }}>{item.label}</button>
        ))}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0" }}>💬 Custom Messages</h1>
        <p style={{ color: "#666", margin: 0 }}>Customize your WhatsApp notification messages for each event</p>
      </div>

      {fetcher.data?.success && (
        <div style={{ background: "#E3F1DF", border: "1px solid #C6E0C0", color: "#008060", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
          ✅ Messages saved successfully!
        </div>
      )}

      <fetcher.Form method="post">
        <input type="hidden" name="adminNumbers" value={adminNumbers.filter(n => n.trim()).join(",")} />

        <MessageCard icon="📦" title="Order Confirmation" desc="Sent when customer places an order" color="#008060"
          name="orderConfirmationMessage" value={orderMessage} onChange={setOrderMessage}
          enabled={orderEnabled} enabledName="orderConfirmationEnabled" onEnabledChange={setOrderEnabled} />

        {/* Button Labels */}
        <div style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "24px", marginBottom: "20px", borderLeft: "4px solid #6B46C1" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px 0" }}>🔘 Order Confirmation Buttons</h2>
            <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Customize the button labels customers see on WhatsApp (max 20 characters each)</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px", color: "#008060" }}>✅ Confirm Button Text</label>
              <input type="text" name="confirmButtonText" value={confirmButtonText} onChange={(e) => setConfirmButtonText(e.target.value.slice(0, 20))} maxLength={20}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e1e3e5", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              <div style={{ fontSize: "12px", color: confirmButtonText.length >= 18 ? "#D72C0D" : "#666", marginTop: "4px" }}>{confirmButtonText.length}/20 characters</div>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px", color: "#D72C0D" }}>❌ Cancel Button Text</label>
              <input type="text" name="cancelButtonText" value={cancelButtonText} onChange={(e) => setCancelButtonText(e.target.value.slice(0, 20))} maxLength={20}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e1e3e5", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              <div style={{ fontSize: "12px", color: cancelButtonText.length >= 18 ? "#D72C0D" : "#666", marginTop: "4px" }}>{cancelButtonText.length}/20 characters</div>
            </div>
          </div>
          <div style={{ marginTop: "16px", background: "#f6f6f7", borderRadius: "8px", padding: "16px" }}>
            <strong style={{ fontSize: "13px" }}>📱 Button Preview:</strong>
            <div style={{ marginTop: "12px", background: "white", borderRadius: "8px", padding: "12px", border: "1px solid #e1e3e5", maxWidth: "280px" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#333" }}>Please confirm your order.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #008060", color: "#008060", fontWeight: "bold", fontSize: "13px", textAlign: "center" }}>{confirmButtonText || "✅ Yes, Confirm"}</div>
                <div style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #D72C0D", color: "#D72C0D", fontWeight: "bold", fontSize: "13px", textAlign: "center" }}>{cancelButtonText || "❌ No, Cancel"}</div>
              </div>
            </div>
          </div>
        </div>

        <MessageCard icon="🚚" title="Fulfillment Message" desc="Sent when order is shipped" color="#0076D6"
          name="fulfillmentMessage" value={fulfillmentMessage} onChange={setFulfillmentMessage}
          enabled={fulfillmentEnabled} enabledName="fulfillmentEnabled" onEnabledChange={setFulfillmentEnabled} />

        <MessageCard icon="❌" title="Cancellation Message" desc="Sent when order is cancelled" color="#D72C0D"
          name="cancellationMessage" value={cancellationMessage} onChange={setCancellationMessage}
          enabled={cancellationEnabled} enabledName="cancellationEnabled" onEnabledChange={setCancellationEnabled} />

        {/* Admin Notification */}
        <div style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "24px", marginBottom: "20px", borderLeft: "4px solid #1a73e8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px 0" }}>🔔 Admin Notification</h2>
              <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Send order notifications to admin WhatsApp numbers when new orders are placed</p>
            </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="hidden" name="adminNotificationEnabled" value={adminEnabled ? "true" : "false"} />
                <button type="button" onClick={() => setAdminEnabled(!adminEnabled)} style={{
                  padding: "8px 20px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px", cursor: "pointer",
                  background: adminEnabled ? "#1a73e8" : "#f6f6f7",
                  color: adminEnabled ? "white" : "#666",
                  border: adminEnabled ? "1px solid #1a73e8" : "1px solid #e1e3e5"
                }}>
                  {adminEnabled ? "✅ Enabled" : "⭕ Disabled"}
                </button>
              </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "12px", fontSize: "14px" }}>📱 Admin Numbers</label>
            {adminNumbers.map((num, index) => (
              <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1a73e8", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", flexShrink: 0 }}>
                  {index + 1}
                </div>
                <input type="text" placeholder="e.g. 923001234567 (with country code, no +)" value={num}
                  onChange={(e) => updateAdminNumber(index, e.target.value)} disabled={!adminEnabled}
                  style={{ flex: 1, padding: "10px 12px", border: "1px solid #e1e3e5", borderRadius: "6px", fontSize: "14px", opacity: adminEnabled ? 1 : 0.5 }} />
                {adminNumbers.length > 1 && (
                  <button type="button" onClick={() => removeAdminNumber(index)}
                    style={{ padding: "8px 12px", background: "#FFF4F4", border: "1px solid #FFCDD2", borderRadius: "6px", color: "#D72C0D", cursor: "pointer", fontWeight: "bold" }}>
                    🗑️
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addAdminNumber} disabled={!adminEnabled}
              style={{ marginTop: "8px", padding: "8px 16px", background: adminEnabled ? "#f0f7ff" : "#f6f6f7", border: "1px solid #1a73e8", borderRadius: "6px", color: "#1a73e8", cursor: adminEnabled ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "13px", opacity: adminEnabled ? 1 : 0.5 }}>
              + Add More Admin Numbers
            </button>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Enter numbers with country code but without + sign. e.g. 923001234567</p>
          </div>

          <div style={{ background: "#f6f6f7", border: "1px solid #e1e3e5", borderRadius: "6px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
            <strong>Available variables:</strong>
            <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              {adminVariables.map(([variable, desc]) => (
                <div key={variable} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <code style={{ background: "#e1e3e5", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{variable}</code>
                  <span style={{ color: "#666", fontSize: "12px" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <textarea name="adminNotificationMessage" value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} rows={8} disabled={!adminEnabled}
            style={{ width: "100%", padding: "12px", border: "1px solid #e1e3e5", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical", fontFamily: "Arial", opacity: adminEnabled ? 1 : 0.5 }} />

          <div style={{ marginTop: "12px", background: "#f0f7ff", border: "1px solid #b8d9f8", borderRadius: "6px", padding: "12px" }}>
            <strong style={{ fontSize: "13px" }}>📱 Preview:</strong>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
              {adminMessage.replace("{shopName}", "Zantac Solution").replace("{orderName}", "#1001").replace("{customerName}", "Zain").replace("{phone}", "923001234567").replace("{items}", "Ski Wax x1").replace("{total}", "PKR 500").replace("{address}", "Karachi")}
            </p>
          </div>
        </div>

        {/* Abandoned Cart */}
        <div style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "24px", marginBottom: "20px", borderLeft: "4px solid #FF8C00" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px 0" }}>🛒 Abandoned Cart Recovery</h2>
              <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>Recover lost sales by messaging customers who abandon their cart</p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" name="abandonedCartEnabled" value="true" checked={abandonedCartEnabled} onChange={(e) => setAbandonedCartEnabled(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#FF8C00" }} />
              <span style={{ fontWeight: "bold", color: abandonedCartEnabled ? "#FF8C00" : "#666" }}>{abandonedCartEnabled ? "Enabled" : "Disabled"}</span>
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>⏱️ Send message after:</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[{ label: "Instant", value: 0 }, { label: "5 minutes", value: 5 }, { label: "30 minutes", value: 30 }, { label: "1 hour", value: 60 }, { label: "2 hours", value: 120 }, { label: "6 hours", value: 360 }, { label: "24 hours", value: 1440 }].map((option) => (
                <button key={option.value} type="button" onClick={() => setAbandonedCartDelay(option.value)}
                  style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", background: abandonedCartDelay === option.value ? "#FF8C00" : "#f6f6f7", color: abandonedCartDelay === option.value ? "white" : "#333", border: abandonedCartDelay === option.value ? "1px solid #FF8C00" : "1px solid #e1e3e5" }}>
                  {option.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="abandonedCartDelay" value={abandonedCartDelay} />
          </div>

          <div style={{ background: "#f6f6f7", border: "1px solid #e1e3e5", borderRadius: "6px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
            <strong>Available variables:</strong>
            <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              {cartVariables.map(([variable, desc]) => (
                <div key={variable} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <code style={{ background: "#e1e3e5", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{variable}</code>
                  <span style={{ color: "#666", fontSize: "12px" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <textarea name="abandonedCartMessage" value={abandonedCartMessage} onChange={(e) => setAbandonedCartMessage(e.target.value)} rows={5} disabled={!abandonedCartEnabled}
            style={{ width: "100%", padding: "12px", border: "1px solid #e1e3e5", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical", fontFamily: "Arial", opacity: abandonedCartEnabled ? 1 : 0.5 }} />

          <div style={{ marginTop: "12px", background: "#fff8f0", border: "1px solid #ffd79d", borderRadius: "6px", padding: "12px" }}>
            <strong style={{ fontSize: "13px" }}>📱 Preview:</strong>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
              {abandonedCartMessage.replace("{customerName}", "Zain").replace("{items}", "Ski Wax x1").replace("{total}", "PKR 500").replace("{checkoutUrl}", "https://zantacsolution.myshopify.com/checkouts/abc123")}
            </p>
          </div>
        </div>

        <button type="submit" style={{ background: "#008060", color: "white", border: "none", padding: "14px 32px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", width: "100%" }}>
          {fetcher.state === "submitting" ? "Saving..." : "💾 Save All Messages"}
        </button>
      </fetcher.Form>
    </div>
  );
}
