const User = require('../models/User');
const Setting = require('../models/Setting');

/**
 * Assign next support user in round-robin fashion
 * @returns {Promise<Object>} The assigned support user object
 */
const assignNextSupport = async () => {
  try {
    // Get all support users ordered by createdAt
    const supportUsers = await User.find({ role: 'support' })
      .select('_id name email')
      .sort({ createdAt: 1 });

    if (supportUsers.length === 0) {
      throw new Error('No support users found');
    }

    // Get the last assigned support ID from settings
    const lastAssignedId = await Setting.getValue('lastAssignedSupportId', null);
    
    let nextIndex = 0;
    
    if (lastAssignedId) {
      // Find the index of the last assigned user
      const lastIndex = supportUsers.findIndex(user => user._id.toString() === lastAssignedId);
      
      if (lastIndex !== -1) {
        // Pick the next index with wrap-around
        nextIndex = (lastIndex + 1) % supportUsers.length;
      }
    }

    // Get the next support user
    const assignedUser = supportUsers[nextIndex];
    
    // Update the last assigned support ID atomically
    await Setting.setValue(
      'lastAssignedSupportId', 
      assignedUser._id.toString(),
      'Last assigned support user ID for round-robin assignment'
    );

    console.log(`Assigned order to support user: ${assignedUser.name} (${assignedUser.email})`);
    
    return assignedUser;
  } catch (error) {
    console.error('Error in assignNextSupport:', error);
    throw error;
  }
};

/**
 * Get all support users (for debugging/admin purposes)
 * @returns {Promise<Array>} Array of support users
 */
const getSupportUsers = async () => {
  try {
    return await User.find({ role: 'support' })
      .select('_id name email createdAt')
      .sort({ createdAt: 1 });
  } catch (error) {
    console.error('Error getting support users:', error);
    throw error;
  }
};

/**
 * Reset the assignment counter (for testing purposes)
 * @returns {Promise<void>}
 */
const resetAssignment = async () => {
  try {
    await Setting.setValue(
      'lastAssignedSupportId', 
      null,
      'Reset assignment counter'
    );
    console.log('Assignment counter reset');
  } catch (error) {
    console.error('Error resetting assignment:', error);
    throw error;
  }
};

module.exports = {
  assignNextSupport,
  getSupportUsers,
  resetAssignment
};
