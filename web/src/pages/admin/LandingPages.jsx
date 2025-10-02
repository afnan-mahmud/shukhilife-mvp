import { useEffect, useState } from 'react';
import { productsApi } from '../../api/products';
import { landingApi } from '../../api/landing';

export default function LandingPages() {
  // Form state
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [html, setHtml] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState(null);

  // List state
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadProducts();
    loadLandingPages();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productsApi.listBasic();
      setProducts(res.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadLandingPages = async () => {
    try {
      setLoading(true);
      const res = await landingApi.list();
      if (res.data.ok) {
        setLandingPages(res.data.data || []);
      }
    } catch (error) {
      console.error('Error loading landing pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setMsg('');
    if (!productId) return setMsg('Please select a product.');
    
    try {
      setSaving(true);
      
      if (editingId) {
        // Update existing
        await landingApi.update(editingId, { productId, html, active });
        setMsg('Updated successfully!');
      } else {
        // Create new
        await landingApi.create({ productId, html, active });
        setMsg('Created successfully!');
      }
      
      // Reset form
      setProductId('');
      setHtml('');
      setActive(true);
      setEditingId(null);
      
      // Refresh list
      loadLandingPages();
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (landing) => {
    setEditingId(landing.id);
    setProductId(landing.product.id);
    setHtml(landing.html || '');
    setActive(landing.active);
    setMsg('');
  };

  const handleDelete = async (id, productName) => {
    if (!window.confirm(`Are you sure you want to delete the landing page for "${productName}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await landingApi.delete(id);
      setMsg('Deleted successfully!');
      loadLandingPages();
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (slug) => {
    window.open(`/p/${slug}`, '_blank');
  };

  const handleCopyLink = (slug) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setMsg('Link copied to clipboard!');
      setTimeout(() => setMsg(''), 3000);
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setProductId('');
    setHtml('');
    setActive(true);
    setMsg('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Landing Pages</h1>

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">
          {editingId ? 'Edit Landing Page' : 'Create Landing Page'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product *
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={saving}
              >
                <option value="">Select product…</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={saving}
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={saving || !productId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : (editingId ? 'Update' : 'Create')}
              </button>
              
              {editingId && (
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>

            {msg && (
              <div className={`text-sm p-3 rounded ${
                msg.includes('success') || msg.includes('copied') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {msg}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom HTML (renders above checkout)
            </label>
            <textarea
              className="w-full h-64 border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="<section>... your HTML ...</section>"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Landing Pages</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading landing pages...</p>
          </div>
        ) : landingPages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No landing pages yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {landingPages.map((landing) => (
                  <tr key={landing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {landing.product?.name || 'Unknown Product'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {landing.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        landing.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {landing.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(landing.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(landing)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleView(landing.slug)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleCopyLink(landing.slug)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleDelete(landing.id, landing.product?.name)}
                          disabled={deletingId === landing.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deletingId === landing.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
