import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'support'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/users');
      // Normalize user IDs to ensure stable id field
      const normalizedUsers = response.data.users.map(user => ({
        ...user,
        id: user._id || user.id
      }));
      setUsers(normalizedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormError('');
  };

  // Client-side validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!editingUser && !formData.password) {
      errors.password = 'Password is required';
    } else if (!editingUser && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!editingUser && formData.password.length > 0 && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFieldErrors({});

    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      // Prepare payload with trimmed values
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role
      };
      
      // Only include password for new users or if editing and password is provided
      if (!editingUser || (editingUser && formData.password)) {
        payload.password = formData.password;
      }

      if (editingUser) {
        // Update existing user
        const response = await api.patch(`/api/admin/users/${editingUser.id}`, payload);
        if (response.data.ok) {
          alert('User updated successfully!');
        } else {
          setFormError(response.data.message || 'Failed to update user');
          setFormLoading(false);
          return;
        }
      } else {
        // Create new user
        const response = await api.post('/api/admin/users', payload);
        if (response.data.ok) {
          alert('User created successfully!');
        } else {
          setFormError(response.data.message || 'Failed to create user');
          setFormLoading(false);
          return;
        }
      }
      
      // Success - clear form and refresh
      setFormData({ name: '', email: '', password: '', role: 'support' });
      setShowCreateForm(false);
      setEditingUser(null);
      setFieldErrors({});
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      
      if (err.response?.data?.fields) {
        // Server returned field-specific errors
        setFieldErrors(err.response.data.fields);
        setFormError(err.response.data.message || 'Validation failed');
      } else if (err.response?.data?.message) {
        // Server returned a general error message
        setFormError(err.response.data.message);
      } else {
        setFormError('Failed to save user');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowCreateForm(true);
  };

  // Helper function to check if delete is allowed
  const canDeleteUser = (userId, userRole) => {
    if (!userId || userId === 'undefined') return false;
    if (currentUser && currentUser._id === userId) return false; // Can't delete self
    if (userRole === 'admin') return false; // Can't delete admins
    return true;
  };

  const handleDelete = async (userId, userName, userEmail, userRole) => {
    // Defensive checks before API call
    if (!userId || userId === 'undefined') {
      alert('Invalid user ID');
      return;
    }

    // Check if trying to delete self
    if (currentUser && currentUser._id === userId) {
      alert('You cannot delete your own account');
      return;
    }

    // Check if trying to delete an admin (optional policy)
    if (userRole === 'admin') {
      alert('Deleting Admin users is not allowed');
      return;
    }

    // Confirm dialog with user details
    const confirmMessage = `Are you sure you want to delete user "${userName}" (${userEmail})?\n\nThis action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.delete(`/api/admin/users/${userId}`);
        if (response.data.ok) {
          fetchUsers(); // Refresh the list
        } else {
          alert(response.data.message || 'Failed to delete user');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        const errorMessage = err.response?.data?.message || 'Failed to delete user';
        alert(errorMessage);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', email: '', password: '', role: 'support' });
    setShowCreateForm(false);
    setEditingUser(null);
    setFormError('');
    setFieldErrors({});
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      support: 'bg-green-100 text-green-800',
      packaging: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New User
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Create/Edit User Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.name 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.email 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.role 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="support">Support</option>
                  <option value="packaging">Packaging</option>
                  <option value="admin">Admin</option>
                </select>
                {fieldErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name, user.email, user.role)}
                          disabled={!canDeleteUser(user.id, user.role)}
                          className={`${
                            canDeleteUser(user.id, user.role)
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            !user.id || user.id === 'undefined'
                              ? 'Invalid user ID'
                              : currentUser && currentUser._id === user.id
                              ? 'Cannot delete your own account'
                              : user.role === 'admin'
                              ? 'Cannot delete Admin users'
                              : 'Delete user'
                          }
                        >
                          Delete
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
};

export default AdminUsers;
