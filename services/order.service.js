/**
 * Order Service
 */

const orders = new Map();

export const saveOrder = async (orderData) => {
  try {
    if (orders.has(orderData.orderId)) {
      console.log("Order already exists:", orderData.orderId);
      return orders.get(orderData.orderId);
    }

    const order = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.set(order.orderId, order);
    console.log("Order saved:", order.orderId);

    return order;
  } catch (error) {
    console.error("Error saving order:", error.message);
    throw new Error("Failed to save order");
  }
};

export const getOrderById = async (orderId) => {
  const order = orders.get(orderId);
  if (!order) throw new Error("Order not found");
  return order;
};

export const getOrderBySessionId = async (sessionId) => {
  for (const order of orders.values()) {
    if (order.stripeSessionId === sessionId) {
      return order;
    }
  }
  return null;
};

export const updateOrderStatus = async (orderId, status) => {
  const order = orders.get(orderId);
  if (!order) throw new Error("Order not found");

  order.status = status;
  order.updatedAt = new Date();
  return order;
};

export const getAllOrders = async () => {
  return Array.from(orders.values());
};
