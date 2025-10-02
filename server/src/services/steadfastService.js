const axios = require('axios');
const config = require('../config/env');

/**
 * Steadfast Courier Service
 * Handles all API calls to Steadfast/Packzy courier service
 */

// Create axios instance with default configuration
const steadfastClient = axios.create({
  baseURL: config.STEADFAST_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Api-Key': config.STEADFAST_API_KEY,
    'Secret-Key': config.STEADFAST_SECRET_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Create a single order in Steadfast
 * @param {Object} payload - Order payload for Steadfast API
 * @returns {Promise<Object>} - Normalized response
 */
const createOrder = async (payload) => {
  try {
    console.log('Sending order to Steadfast:', { 
      invoice: payload.invoice, 
      recipient_name: payload.recipient_name,
      recipient_phone: payload.recipient_phone 
    });

    const response = await steadfastClient.post('/create_order', payload);
    
    // Extract consignment data from response
    const consignment = response.data.consignment || response.data;
    const consignmentId = consignment.consignment_id || consignment.consignmentId;
    const trackingCode = consignment.tracking_code || consignment.trackingCode;
    const status = consignment.status || 'created';

    if (!consignmentId) {
      return {
        ok: false,
        message: 'No consignment ID received from Steadfast',
        vendor: {
          status: response.status,
          data: response.data
        }
      };
    }

    return {
      ok: true,
      data: {
        consignmentId: Number(consignmentId),
        trackingCode: trackingCode || null,
        status: status
      }
    };

  } catch (error) {
    console.error('Steadfast createOrder error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    return {
      ok: false,
      message: error.response?.data?.message || 'Steadfast API error',
      vendor: {
        status: error.response?.status || 0,
        data: error.response?.data || null
      }
    };
  }
};

/**
 * Create multiple orders in bulk
 * @param {Array} dataArray - Array of order payloads
 * @returns {Promise<Object>} - Normalized response
 */
const bulkCreate = async (dataArray) => {
  try {
    console.log(`Sending ${dataArray.length} orders to Steadfast in bulk`);

    const response = await steadfastClient.post('/create_order/bulk-order', {
      data: JSON.stringify(dataArray)
    });

    return {
      ok: true,
      data: response.data
    };

  } catch (error) {
    console.error('Steadfast bulkCreate error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    return {
      ok: false,
      message: error.response?.data?.message || 'Steadfast bulk API error',
      vendor: {
        status: error.response?.status || 0,
        data: error.response?.data || null
      }
    };
  }
};

/**
 * Get order status by consignment ID
 * @param {Number} consignmentId - Consignment ID
 * @returns {Promise<Object>} - Normalized response
 */
const statusByConsignmentId = async (consignmentId) => {
  try {
    console.log(`Checking Steadfast status for consignment ID: ${consignmentId}`);

    const response = await steadfastClient.get(`/status_by_cid/${consignmentId}`);

    return {
      ok: true,
      data: response.data
    };

  } catch (error) {
    console.error('Steadfast statusByConsignmentId error:', {
      consignmentId,
      status: error.response?.status,
      message: error.message
    });

    return {
      ok: false,
      message: error.response?.data?.message || 'Failed to get status',
      vendor: {
        status: error.response?.status || 0,
        data: error.response?.data || null
      }
    };
  }
};

/**
 * Get order status by invoice
 * @param {String} invoice - Invoice number
 * @returns {Promise<Object>} - Normalized response
 */
const statusByInvoice = async (invoice) => {
  try {
    console.log(`Checking Steadfast status for invoice: ${invoice}`);

    const response = await steadfastClient.get(`/status_by_invoice/${invoice}`);

    return {
      ok: true,
      data: response.data
    };

  } catch (error) {
    console.error('Steadfast statusByInvoice error:', {
      invoice,
      status: error.response?.status,
      message: error.message
    });

    return {
      ok: false,
      message: error.response?.data?.message || 'Failed to get status',
      vendor: {
        status: error.response?.status || 0,
        data: error.response?.data || null
      }
    };
  }
};

/**
 * Get order status by tracking code
 * @param {String} trackingCode - Tracking code
 * @returns {Promise<Object>} - Normalized response
 */
const statusByTracking = async (trackingCode) => {
  try {
    console.log(`Checking Steadfast status for tracking code: ${trackingCode}`);

    const response = await steadfastClient.get(`/status_by_trackingcode/${trackingCode}`);

    return {
      ok: true,
      data: response.data
    };

  } catch (error) {
    console.error('Steadfast statusByTracking error:', {
      trackingCode,
      status: error.response?.status,
      message: error.message
    });

    return {
      ok: false,
      message: error.response?.data?.message || 'Failed to get status',
      vendor: {
        status: error.response?.status || 0,
        data: error.response?.data || null
      }
    };
  }
};

/**
 * Get account balance
 * @returns {Promise<Object>} - Normalized response
 */
const getBalance = async () => {
  try {
    console.log('Fetching Steadfast account balance');

    const response = await steadfastClient.get('/get_balance');

    return {
      ok: true,
      data: response.data
    };

  } catch (error) {
    console.error('Steadfast getBalance error:', {
      status: error.response?.status,
      message: error.message
    });

    return {
      ok: false,
      message: error.response?.data?.message || 'Failed to get balance',
      vendor: {
        status: error.response?.status || 0,
        data: error.response?.data || null
      }
    };
  }
};

module.exports = {
  createOrder,
  bulkCreate,
  statusByConsignmentId,
  statusByInvoice,
  statusByTracking,
  getBalance
};
