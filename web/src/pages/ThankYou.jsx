import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const invoice = searchParams.get('invoice');

  useEffect(() => {
    if (invoice) {
      fetchOrder();
    } else {
      setError('No invoice provided');
      setLoading(false);
    }
  }, [invoice]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/api/checkout/${invoice}`);
      setOrder(response.data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      if (err.response?.status === 404) {
        setError('Order not found');
      } else {
        setError('Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Shukhi Life</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          <p className="text-xl text-gray-600">
            Thank you for your order. We'll process it shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Order Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice:</span>
                    <span className="font-medium">{order.invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(order.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{order.phone}</span>
                  </div>
                  {order.altPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alt Phone:</span>
                      <span className="font-medium">{order.altPhone}</span>
                    </div>
                  )}
                  {order.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{order.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product & Delivery Info */}
            <div className="space-y-4">
              {/* Product Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Product Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{order.productSnapshot?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Price:</span>
                    <span className="font-medium">{formatCurrency(order.productSnapshot?.price || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 block mb-1">Address:</span>
                    <span className="font-medium text-sm">{order.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-blue-900 mb-4">What happens next?</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  1
                </div>
              </div>
              <div>
                <p className="text-blue-900 font-medium">Order Confirmation</p>
                <p className="text-blue-700 text-sm">Our support team will contact you within 24 hours to confirm your order details.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  2
                </div>
              </div>
              <div>
                <p className="text-blue-900 font-medium">Processing & Packaging</p>
                <p className="text-blue-700 text-sm">Your order will be processed and prepared for shipment.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  3
                </div>
              </div>
              <div>
                <p className="text-blue-900 font-medium">Delivery</p>
                <p className="text-blue-700 text-sm">Your order will be delivered to the address provided within 3-5 business days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you have any questions about your order, please contact our support team.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Support Team:</strong> {order.assignedTo?.name} ({order.assignedTo?.email})
            </p>
            <p className="text-sm text-gray-600">
              <strong>Order Reference:</strong> {order.invoice}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium mr-4"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
          >
            Print Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
