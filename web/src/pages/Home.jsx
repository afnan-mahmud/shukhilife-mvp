import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products?active=1');
      setProducts(response.data.products.slice(0, 6)); // Show first 6 products
    } catch (err) {
      console.error('Error fetching products:', err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Shukhi Life</h1>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Welcome to Shukhi Life</h2>
            <p className="text-xl mb-8">Simple, fast, and reliable online shopping</p>
            <button
              onClick={() => navigate('/p/wireless-headphones')}
              className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100"
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">Featured Products</h3>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">No Products Available</h4>
            <p className="text-gray-600">Check back later for new products!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/p/${product.slug}`)}
              >
                <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-400 text-4xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    {formatCurrency(product.price)}
                  </p>
                  {product.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h4 className="text-xl font-bold mb-4">Shukhi Life</h4>
            <p className="text-gray-400">Simple, fast, and reliable online shopping</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
