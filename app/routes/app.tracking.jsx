import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const logs = await prisma.messageLog.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  let responses = [];
  try {
    responses = await prisma.orderResponse.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
  } catch (e) {
    responses = [];
  }

  // Count orders per phone number from message logs
  const phoneCounts = {};
  const phoneNames = {};
  logs.forEach(log => {
    if (log.messageType === "order_confirmation") {
      const phone = log.phone;
      phoneCounts[phone] = (phoneCounts[phone] || 0) + 1;
      phoneNames[phone] = log.customerName;
    }
  });

  // Star customers — ordered 4+ times
  const starCustomers = Object.entries(phoneCounts)
    .filter(([phone, count]) => count >= 4)
    .map(([phone, count]) => ({
      phone,
      customerName: phoneNames[phone] || "Customer",
      orderCount: count
    }))
    .sort((a, b) => b.orderCount - a.orderCount);

  return { logs, responses, starCustomers, phoneCounts };
};

export default function TrackingOrders() {
  const { logs, responses, starCustomers, phoneCounts } = useLoaderData();
  const navigate = useNavigate();
  const currentPath = "/app/tracking";

  const nav = [
    { label: "📊 Dashboard", href: "/app" },
    { label: "💬 Custom Message", href: "/app/custom-message" },
    { label: "📋 Tracking Orders", href: "/app/tracking" },
    { label: "⚙️ Settings", href: "/app/settings" },
  ];

  const getTypeStyle = (type) => {
    if (type === "order_confirmation") return { bg: "#E3F1DF", color: "#008060", label: "📦 Order" };
    if (type === "fulfillment") return { bg: "#EAF4FB", color: "#0076D6", label: "🚚 Fulfilled" };
    if (type === "abandoned_cart") return { bg: "#FFF4E3", color: "#FF8C00", label: "🛒 Abandoned" };
    return { bg: "#FFF4F4", color: "#D72C0D", label: "❌ Cancelled" };
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "2px solid #e1e3e5", paddingBottom: "16px" }}>
        {nav.map((item) => (
          <button key={item.href} onClick={() => navigate(item.href)} style={{
            padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", fontSize: "14px",
            background: item.href === currentPath ? "#008060" : "#f6f6f7",
            color: item.href === currentPath ? "white" : "#333",
            border: item.href === currentPath ? "1px solid #008060" : "1px solid #e1e3e5",
            cursor: "pointer"
          }}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0" }}>📋 Tracking Orders</h1>
        <p style={{ color: "#666", margin: 0 }}>Complete history of all WhatsApp notifications sent</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Sent", value: logs.filter(l => l.status === "sent").length, color: "#008060", icon: "✅" },
          { label: "Failed", value: logs.filter(l => l.status === "failed").length, color: "#D72C0D", icon: "❌" },
          { label: "Total Logs", value: logs.length, color: "#0076D6", icon: "📊" },
          { label: "Confirmed", value: responses.filter(r => r.response === "confirmed").length, color: "#008060", icon: "✅" },
          { label: "Cancelled", value: responses.filter(r => r.response === "cancelled").length, color: "#D72C0D", icon: "🚫" },
          { label: "Star Customers", value: starCustomers.length, color: "#FF8C00", icon: "⭐" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "24px" }}>{stat.icon}</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ⭐ Star Customers Section */}
      <div style={{ background: "white", border: "1px solid #FFD700", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #FFD700", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #fff8e1, #fff3cd)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>⭐ Star Customers</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#666" }}>Customers who ordered 4 or more times</p>
          </div>
          <span style={{ color: "#666", fontSize: "14px" }}>{starCustomers.length} star customers</span>
        </div>

        {starCustomers.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>⭐</div>
            <p>No star customers yet. Customers with 4+ orders will appear here.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fffdf0" }}>
                {["#", "Customer", "Phone", "Total Orders", "Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#666", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {starCustomers.map((customer, i) => (
                <tr key={customer.phone} style={{ borderTop: "1px solid #fff3cd", background: i % 2 === 0 ? "white" : "#fffdf0" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#999" }}>{i + 1}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "bold" }}>
                    {customer.orderCount >= 10 ? "👑 " : customer.orderCount >= 7 ? "🌟 " : "⭐ "}
                    {customer.customerName}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>{customer.phone}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", background: "#fff8e1", color: "#FF8C00", border: "1px solid #FFD700" }}>
                      🛍️ {customer.orderCount} orders
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
                      background: customer.orderCount >= 10 ? "#fff3e0" : customer.orderCount >= 7 ? "#f3e5f5" : "#E3F1DF",
                      color: customer.orderCount >= 10 ? "#E65100" : customer.orderCount >= 7 ? "#6B46C1" : "#008060"
                    }}>
                      {customer.orderCount >= 10 ? "👑 VIP" : customer.orderCount >= 7 ? "🌟 Premium" : "⭐ Star"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Responses Table */}
      <div style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e1e3e5", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0f7ff" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>🔘 Customer Responses</h2>
          <span style={{ color: "#666", fontSize: "14px" }}>{responses.length} total responses</span>
        </div>

        {responses.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <h3>No responses yet</h3>
            <p>Customers will appear here after they click Confirm or Cancel on WhatsApp</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f6f6f7" }}>
                {["Order", "Customer", "Phone", "Response", "Date & Time"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#666", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((r, i) => (
                <tr key={r.id} style={{ borderTop: "1px solid #e1e3e5", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#008060" }}>{r.orderName}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {r.customerName}
                      {phoneCounts[r.phone] >= 4 && (
                        <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: "#fff8e1", color: "#FF8C00", border: "1px solid #FFD700" }}>
                          ⭐ {phoneCounts[r.phone]}x
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>{r.phone}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold",
                      background: r.response === "confirmed" ? "#E3F1DF" : "#FFF4F4",
                      color: r.response === "confirmed" ? "#008060" : "#D72C0D"
                    }}>
                      {r.response === "confirmed" ? "✅ Confirmed" : "❌ Cancelled"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* All Notifications Table */}
      <div style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e1e3e5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>All Notifications</h2>
          <span style={{ color: "#666", fontSize: "14px" }}>{logs.length} total records</span>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <h3>No notifications sent yet</h3>
            <p>Place a test order to see tracking data here</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f6f6f7" }}>
                {["Order", "Customer", "Phone", "Type", "Status", "Date & Time"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#666", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const typeStyle = getTypeStyle(log.messageType);
                return (
                  <tr key={log.id} style={{ borderTop: "1px solid #e1e3e5", background: index % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#008060" }}>{log.orderName}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {log.customerName}
                        {phoneCounts[log.phone] >= 4 && (
                          <span style={{ padding: "2px 6px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: "#fff8e1", color: "#FF8C00", border: "1px solid #FFD700" }}>
                            ⭐ {phoneCounts[log.phone]}x
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>{log.phone}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: typeStyle.bg, color: typeStyle.color }}>
                        {typeStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
                        background: log.status === "sent" ? "#E3F1DF" : "#FFF4F4",
                        color: log.status === "sent" ? "#008060" : "#D72C0D"
                      }}>
                        {log.status === "sent" ? "✅ Sent" : "❌ Failed"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}