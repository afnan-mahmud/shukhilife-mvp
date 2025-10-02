import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api, extractErrorMessage } from '../api/client';
import { landingApi } from '../api/landing';
import { trackPurchase, trackAddToCart } from '../pixels/pixelUtils';

const ProductLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [landing, setLanding] = useState(null);
  
  // Simplified form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState("inside"); // inside Dhaka
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!product?.slug) return;
    landingApi.getBySlug(product.slug)
      .then(res => setLanding(res?.data?.ok && res.data.data ? res.data.data : null))
      .catch(() => setLanding(null));
  }, [product?.slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/api/products/slug/${slug}`);
      setProduct(response.data.product);
    } catch (err) {
      console.error('Error fetching product:', err);
      if (err.response?.status === 404) {
        setError('Product not found');
      } else {
        setError('Failed to load product');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate shipping cost and total
  const shippingCost = delivery === "inside" ? 80 : 130;
  const productTotal = product ? product.price * quantity : 0;
  const total = productTotal + shippingCost;

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, newQuantity));
    
    // Track add to cart when quantity is increased
    if (product && newQuantity > 1) {
      const value = product.price * newQuantity;
      trackAddToCart(product.slug, value, 'BDT');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!product) return;
    
    setSubmitting(true);
    try {
      const orderData = {
        productId: product.id,
        quantity: quantity,
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        deliveryLocation: delivery,
        shippingCost: shippingCost,
        totalPrice: total
      };

      const response = await api.post('/api/checkout', orderData);
      
      if (response.data.success) {
        // Track purchase event
        trackPurchase(response.data.invoice, total, 'BDT', product.slug);
        
        // Redirect to thank you page with invoice
        navigate(`/thank-you?invoice=${response.data.invoice}`);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      const errorMsg = extractErrorMessage(err);
      alert(`Failed to place order: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${amount}৳`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
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

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Shukhi Life</h1>
        </div>
      </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {landing?.html ? (
            <>
              {/* RENDER LANDING HTML (with inline CSS allowed) */}
              <div
                className="mb-6"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(landing.html, { ADD_TAGS: ['style'], ADD_ATTR: ['class'] }),
                }}
              />

              {/* Checkout only */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">অর্ডার তথ্য দিন</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={handleQuantityChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="আপনার নাম"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="মোবাইল নম্বর"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      placeholder="আপনার ঠিকানা"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Delivery Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Location
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="inside"
                          checked={delivery === "inside"}
                          onChange={() => setDelivery("inside")}
                          className="text-blue-600"
                        />
                        <span>ঢাকার মধ্যে (80৳)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="outside"
                          checked={delivery === "outside"}
                          onChange={() => setDelivery("outside")}
                          className="text-blue-600"
                        />
                        <span>ঢাকার বাইরে (130৳)</span>
                      </label>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{product.name} x {quantity}</span>
                        <span className="font-medium">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatCurrency(shippingCost)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Placing Order...
                      </div>
                    ) : (
                      `অর্ডার কনফার্ম করুন – ${formatCurrency(total)}`
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Default fallback (when no landing page is set)
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img src={product?.image} alt={product?.name} className="rounded-xl w-full" />
                <h1 className="text-2xl font-bold mt-4">{product?.name}</h1>
                <p className="text-indigo-600 text-xl mt-2">{formatCurrency(product?.price)}</p>
                <p className="mt-2 text-gray-600">{product?.description}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">অর্ডার তথ্য দিন</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={handleQuantityChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="আপনার নাম"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="মোবাইল নম্বর"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      placeholder="আপনার ঠিকানা"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Delivery Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Location
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="inside"
                          checked={delivery === "inside"}
                          onChange={() => setDelivery("inside")}
                          className="text-blue-600"
                        />
                        <span>ঢাকার মধ্যে (80৳)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="outside"
                          checked={delivery === "outside"}
                          onChange={() => setDelivery("outside")}
                          className="text-blue-600"
                        />
                        <span>ঢাকার বাইরে (130৳)</span>
                      </label>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{product.name} x {quantity}</span>
                        <span className="font-medium">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatCurrency(shippingCost)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Placing Order...
                      </div>
                    ) : (
                      `অর্ডার কনফার্ম করুন – ${formatCurrency(total)}`
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default ProductLanding;
