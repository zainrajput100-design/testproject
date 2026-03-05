import { sendAbandonedCartMessages } from "../abandonedCart.js";

export const loader = async ({ request }) => {
  console.log("🚀 Manual abandoned cart trigger");
  await sendAbandonedCartMessages();
  return new Response("Done", { status: 200 });
};