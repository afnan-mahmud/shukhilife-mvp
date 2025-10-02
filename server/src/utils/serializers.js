/**
 * Serialize order data with safe null handling
 * @param {Object} order - Mongoose order document
 * @returns {Object} Serialized order data
 */
function serializeOrder(order) {
  const lastNote = order.notes && order.notes.length > 0 
    ? order.notes[order.notes.length - 1] 
    : null;

  return {
    id: order._id,
    invoice: order.invoice,
    customerName: order.customerName,
    phone: order.phone,
    altPhone: order.altPhone || null,
    email: order.email || null,
    address: order.address,
    product: order.product ? {
      id: order.product._id,
      name: order.product.name,
      slug: order.product.slug,
      price: order.product.price,
      image: order.product.image
    } : null,
    productSnapshot: order.productSnapshot || null,
    quantity: order.quantity,
    amount: order.amount,
    formattedAmount: order.formattedAmount,
    status: order.status,
    assignedTo: order.assignedTo ? {
      id: order.assignedTo._id,
      name: order.assignedTo.name,
      email: order.assignedTo.email,
      role: order.assignedTo.role
    } : null,
    lastNote: lastNote ? {
      text: lastNote.text,
      createdAt: lastNote.createdAt,
      author: lastNote.author
    } : null,
    steadfast: order.steadfast || {
      sent: false,
      consignmentId: '',
      lastError: ''
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

/**
 * Serialize landing page data with safe null handling
 * @param {Object} landing - Mongoose landing page document
 * @param {Object} product - Populated product document
 * @returns {Object} Serialized landing page data
 */
function serializeLanding(landing, product) {
  return {
    id: landing._id,
    product: product ? {
      id: product._id,
      name: product.name
    } : null,
    slug: landing.slug,
    html: landing.html,
    active: landing.active,
    updatedAt: landing.updatedAt
  };
}

module.exports = {
  serializeOrder,
  serializeLanding
};
