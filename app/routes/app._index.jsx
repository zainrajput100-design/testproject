import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendAbandonedCartMessages } from "../abandonedCart.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Auto run abandoned cart check every time dashboard opens
setTimeout(() => sendAbandonedCartMessages().catch(console.error), 100);

  const logs = await prisma.messageLog.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const totalMessages = await prisma.messageLog.count({ where: { shop } });
  const orderConfirmations = await prisma.messageLog.count({ where: { shop, messageType: "order_confirmation" } });
  const fulfillments = await prisma.messageLog.count({ where: { shop, messageType: "fulfillment" } });
  const cancellations = await prisma.messageLog.count({ where: { shop, messageType: "cancellation" } });
  const failed = await prisma.messageLog.count({ where: { shop, status: "failed" } });
  const abandonedCarts = await prisma.abandonedCart.count({ where: { shop, messageSent: true } });

  return { logs, totalMessages, orderConfirmations, fulfillments, cancellations, failed, abandonedCarts };
};

export default function Dashboard() {
  const { logs, totalMessages, orderConfirmations, fulfillments, cancellations, failed, abandonedCarts } = useLoaderData();
  const navigate = useNavigate();
  const currentPath = "/app";

  const nav = [
    { label: "📊 Dashboard", href: "/app" },
    { label: "💬 Custom Message", href: "/app/custom-message" },
    { label: "📋 Tracking Orders", href: "/app/tracking" },
    { label: "⚙️ Settings", href: "/app/settings" },
  ];

  const stats = [
    { label: "Total Messages", value: totalMessages, icon: "📱", color: "#008060" },
    { label: "Order Confirmations", value: orderConfirmations, icon: "📦", color: "#0076D6" },
    { label: "Fulfillments", value: fulfillments, icon: "🚚", color: "#6B46C1" },
    { label: "Cancellations", value: cancellations, icon: "❌", color: "#D72C0D" },
    { label: "Abandoned Carts", value: abandonedCarts, icon: "🛒", color: "#FF8C00" },
  ];

  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif", maxWidth: "1000px", margin: "0 auto" }}>

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

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0" }}>
          📊 WhatsApp Dashboard
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Monitor your WhatsApp notification activity
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: "white", border: "1px solid #e1e3e5", borderRadius: "12px",
            padding: "20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Failed Messages Warning */}
      {failed > 0 && (
        <div style={{ background: "#FFF4F4", border: "1px solid #FFCDD2", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", color: "#D72C0D" }}>
          ⚠️ {failed} message(s) failed to send. Check your WhatsApp credentials in Settings.
        </div>
      )}

      {/* Recent Activity */}
      <div style={{ background: "white", border: "1px solid #e1e3e5", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e1e3e5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>📋 Recent Activity</h2>
          <span style={{ color: "#666", fontSize: "14px" }}>{logs.length} recent records</span>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <p>No messages sent yet. Place a test order to get started!</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f6f6f7" }}>
                {["Order", "Customer", "Phone", "Type", "Status", "Time"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#666" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log.id} style={{ borderTop: "1px solid #e1e3e5", background: index % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "bold" }}>{log.orderName}</td>
                  <td style={{ padding: "12px 16px" }}>{log.customerName}</td>
                  <td style={{ padding: "12px 16px", color: "#666" }}>{log.phone}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
                      background: log.messageType === "order_confirmation" ? "#E3F1DF" :
                                  log.messageType === "fulfillment" ? "#EAF4FB" :
                                  log.messageType === "abandoned_cart" ? "#FFF4E3" : "#FFF4F4",
                      color: log.messageType === "order_confirmation" ? "#008060" :
                             log.messageType === "fulfillment" ? "#0076D6" :
                             log.messageType === "abandoned_cart" ? "#FF8C00" : "#D72C0D"
                    }}>
                      {log.messageType === "order_confirmation" ? "📦 Order" :
                       log.messageType === "fulfillment" ? "🚚 Fulfilled" :
                       log.messageType === "abandoned_cart" ? "🛒 Abandoned" : "❌ Cancelled"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
        <button onClick={() => navigate("/app/settings")} style={{
          background: "#008060", color: "white", padding: "10px 20px",
          borderRadius: "6px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer"
        }}>
          ⚙️ Settings
        </button>
        <button onClick={() => navigate("/app/custom-message")} style={{
          background: "#FF8C00", color: "white", padding: "10px 20px",
          borderRadius: "6px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer"
        }}>
          🛒 Abandoned Cart Settings
        </button>
      </div>

    </div>
  );
}
