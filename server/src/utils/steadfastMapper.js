/**
 * Steadfast Courier Payload Mapper
 * Maps our Order model to Steadfast API payload format
 */

/**
 * Convert phone number to 11 digits only
 * @param {String} phone - Phone number
 * @returns {String} - 11 digit phone number
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits; // Already 11 digits starting with 01
  } else if (digits.length === 13 && digits.startsWith('8801')) {
    return digits.substring(2); // Remove country code
  } else if (digits.length === 14 && digits.startsWith('+8801')) {
    return digits.substring(3); // Remove +880 country code
  } else if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits; // Add leading 0
  }
  
  return digits;
};

/**
 * Validate and normalize phone number
 * @param {String} phone - Phone number
 * @param {String} fieldName - Field name for error message
 * @returns {String} - Normalized 11-digit phone number
 * @throws {Error} - If phone number is invalid
 */
const validatePhone = (phone, fieldName = 'phone') => {
  const normalized = normalizePhone(phone);
  
  if (!normalized || normalized.length !== 11 || !normalized.startsWith('01')) {
    throw new Error(`${fieldName} must be 11 digits starting with 01 (e.g., 01712345678)`);
  }
  
  return normalized;
};

/**
 * Map Order to Steadfast payload
 * @param {Object} order - Order document from database
 * @returns {Object} - Steadfast API payload
 * @throws {Error} - If required fields are missing or invalid
 */
const toSteadfastPayload = (order) => {
  try {
    // Validate required fields
    if (!order) {
      throw new Error('Order is required');
    }

    if (!order.invoice) {
      throw new Error('Order invoice is required');
    }

    if (!order.customerName) {
      throw new Error('Customer name is required');
    }

    if (!order.phone) {
      throw new Error('Customer phone is required');
    }

    if (!order.address) {
      throw new Error('Delivery address is required');
    }

    if (!order.amount && order.amount !== 0) {
      throw new Error('Order amount is required');
    }

    // Validate and normalize phone numbers
    const recipientPhone = validatePhone(order.phone, 'recipient_phone');
    const alternativePhone = order.altPhone ? validatePhone(order.altPhone, 'alternative_phone') : null;

    // Validate recipient name length
    const recipientName = order.customerName.trim();
    if (recipientName.length > 100) {
      throw new Error('Recipient name must be 100 characters or less');
    }

    // Validate address length
    const recipientAddress = order.address.trim();
    if (recipientAddress.length > 250) {
      throw new Error('Recipient address must be 250 characters or less');
    }

    // Validate COD amount
    const codAmount = Number(order.amount);
    if (isNaN(codAmount) || codAmount < 0) {
      throw new Error('COD amount must be a valid number >= 0');
    }

    // Build item description
    let itemDescription = '';
    if (order.productSnapshot && order.productSnapshot.name) {
      itemDescription = order.productSnapshot.name;
      if (order.quantity && order.quantity > 1) {
        itemDescription += ` x${order.quantity}`;
      }
    } else if (order.product && order.product.name) {
      itemDescription = order.product.name;
      if (order.quantity && order.quantity > 1) {
        itemDescription += ` x${order.quantity}`;
      }
    } else {
      itemDescription = 'Product order';
    }

    // Get delivery note from last note or create default
    let note = '';
    if (order.notes && order.notes.length > 0) {
      const lastNote = order.notes[order.notes.length - 1];
      note = lastNote.text || '';
    }
    
    if (!note) {
      note = `Order: ${order.invoice}`;
    }

    // Build Steadfast payload
    const payload = {
      invoice: order.invoice,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_address: recipientAddress,
      cod_amount: codAmount.toFixed(2),
      item_description: itemDescription,
      delivery_type: 0, // 0 = home delivery
      note: note.substring(0, 500) // Limit note to 500 characters
    };

    // Add optional fields if present
    if (alternativePhone) {
      payload.alternative_phone = alternativePhone;
    }

    if (order.email && order.email.trim()) {
      payload.recipient_email = order.email.trim();
    }

    if (order.quantity && order.quantity > 1) {
      payload.total_lot = order.quantity;
    }

    return payload;

  } catch (error) {
    // Re-throw with more context
    throw new Error(`Steadfast payload validation failed: ${error.message}`);
  }
};

module.exports = {
  toSteadfastPayload,
  validatePhone,
  normalizePhone
};
