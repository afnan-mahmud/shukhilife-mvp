import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import api from '../../utils/api';

const PackagingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  // Date range state - default to today
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      
      const response = await api.get(`/api/packaging/orders?${params.toString()}`);
      setOrders(response.data.orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [dateRange]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Packaging Orders Report', 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Table headers
    const headers = ['Invoice', 'Product', 'Qty', 'Amount', 'Customer', 'Phone', 'Consignment ID'];
    const colWidths = [25, 40, 15, 20, 30, 25, 30];
    let yPosition = 50;
    
    // Draw table headers
    doc.setFontSize(10);
    let xPosition = 20;
    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    
    // Draw line under headers
    doc.line(20, yPosition + 2, 200, yPosition + 2);
    yPosition += 10;
    
    // Add order data
    orders.forEach((order, index) => {
      if (yPosition > 280) { // Start new page if needed
        doc.addPage();
        yPosition = 20;
      }
      
      const rowData = [
        order.invoice,
        order.productSnapshot?.name || 'N/A',
        order.quantity.toString(),
        `$${order.amount.toFixed(2)}`,
        order.customerName,
        order.phone,
        order.steadfast?.consignmentId || 'N/A'
      ];
      
      xPosition = 20;
      rowData.forEach((data, colIndex) => {
        // Truncate long text
        const text = data.length > 15 ? data.substring(0, 15) + '...' : data;
        doc.text(text, xPosition, yPosition);
        xPosition += colWidths[colIndex];
      });
      
      yPosition += 8;
    });
    
    // Add summary
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`Total Orders: ${orders.length}`, 20, yPosition);
    
    // Save the PDF
    doc.save(`packaging-orders-${dateRange.from}-to-${dateRange.to}.pdf`);
  };

  const handleCompleteAll = async () => {
    if (orders.length === 0) return;
    
    setCompleting(true);
    try {
      // Generate PDF first
      generatePDF();
      
      // Then complete the orders
      const orderIds = orders.map(order => order.id);
      const response = await api.post('/api/packaging/complete-today', { orderIds });
      
      if (response.data.success) {
        alert(`Successfully completed ${response.data.completedCount} orders!`);
        // Refresh the orders list
        fetchOrders();
      }
    } catch (err) {
      console.error('Error completing orders:', err);
      alert('Failed to complete orders');
    } finally {
      setCompleting(false);
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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Packaging Orders</h1>
        
        {/* Complete All Button */}
        <button
          onClick={handleCompleteAll}
          disabled={orders.length === 0 || completing}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {completing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Completing...</span>
            </>
          ) : (
            <>
              <span>📦</span>
              <span>Complete All for Today</span>
            </>
          )}
        </button>
      </div>

      {/* Date Range Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Orders</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-500">
                  No confirmed orders found for the selected date range.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Confirmed Orders ({orders.length})
                    </h3>
                    <span className="text-sm text-gray-500">
                      {dateRange.from === dateRange.to 
                        ? `For ${formatDate(dateRange.from)}`
                        : `From ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`
                      }
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Consignment ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.invoice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.productSnapshot?.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.customerName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.steadfast?.consignmentId ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {order.steadfast.consignmentId}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Not sent</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PackagingOrders;