const axios = require('axios');

/**
 * Send order to Steadfast courier service
 * @param {Object} order - Order object with customer and product details
 * @returns {Promise<Object>} - Response with consignmentId or error
 */
const sendToSteadfast = async (order) => {
  try {
    // Validate required environment variables
    if (!process.env.STEADFAST_API_KEY || !process.env.STEADFAST_SECRET_KEY) {
      throw new Error('Steadfast API credentials not configured');
    }

    // Build payload from order
    const payload = {
      invoice: order.invoice,
      recipient_name: order.customerName,
      recipient_phone: order.phone,
      alternative_phone: order.altPhone || '',
      recipient_email: order.email || '',
      recipient_address: order.address,
      cod_amount: order.amount,
      note: `${order.productSnapshot.name} x${order.quantity}`
    };

    // Check if using test credentials for mock response
    if (process.env.STEADFAST_API_KEY === 'test-api-key-123' && 
        process.env.STEADFAST_SECRET_KEY === 'test-secret-key-456') {
      // Mock successful response for testing
      const mockConsignmentId = `STD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      console.log('Mock Steadfast API call with payload:', JSON.stringify(payload, null, 2));
      
      return {
        success: true,
        consignmentId: mockConsignmentId,
        response: {
          consignment_id: mockConsignmentId,
          status: 'success',
          message: 'Order created successfully (MOCK)'
        }
      };
    }

    // Make API call to Steadfast
    const response = await axios.post(
      `${process.env.STEADFAST_BASE_URL}/create_order`,
      payload,
      {
        headers: {
          'Api-Key': process.env.STEADFAST_API_KEY,
          'Secret-Key': process.env.STEADFAST_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Extract consignment ID from response
    // Steadfast API might return consignment_id, consignmentId, or tracking_id
    const consignmentId = response.data.consignment_id || 
                         response.data.consignmentId || 
                         response.data.tracking_id ||
                         response.data.id;

    if (!consignmentId) {
      throw new Error('No consignment ID received from Steadfast API');
    }

    return {
      success: true,
      consignmentId,
      response: response.data
    };

  } catch (error) {
    console.error('Steadfast API Error:', error.message);
    
    // Handle different types of errors
    if (error.response) {
      // API responded with error status
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          `Steadfast API error: ${error.response.status}`;
      
      return {
        success: false,
        error: errorMessage,
        statusCode: error.response.status,
        response: error.response.data
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: 'Network error: Unable to reach Steadfast API',
        statusCode: 0
      };
    } else {
      // Other error
      return {
        success: false,
        error: error.message,
        statusCode: 0
      };
    }
  }
};

module.exports = {
  sendToSteadfast
};
