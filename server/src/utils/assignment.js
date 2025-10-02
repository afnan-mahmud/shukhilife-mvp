const User = require('../../models/User');
const Setting = require('../../models/Setting');

/**
 * Assign next support user in round-robin fashion
 * @returns {Promise<Object>} The assigned user object
 */
const assignNextSupport = async () => {
  try {
    // Get all support users ordered by creation date
    const supportUsers = await User.find({ role: 'support' }).sort({ createdAt: 1 });
    
    if (supportUsers.length === 0) {
      throw new Error('No support users found');
    }

    // Get or create the last assigned support ID setting
    let setting = await Setting.findOne({ key: 'lastAssignedSupportId' });
    
    if (!setting) {
      // Initialize with first support user
      setting = new Setting({
        key: 'lastAssignedSupportId',
        value: supportUsers[0]._id.toString(),
        description: 'ID of the last assigned support user for round-robin assignment'
      });
      await setting.save();
      return supportUsers[0];
    }

    // Find current index
    const currentIndex = supportUsers.findIndex(user => user._id.toString() === setting.value);
    const nextIndex = (currentIndex + 1) % supportUsers.length;
    const nextUser = supportUsers[nextIndex];

    // Update the setting atomically
    await Setting.findOneAndUpdate(
      { key: 'lastAssignedSupportId' },
      { value: nextUser._id.toString() },
      { upsert: true }
    );

    return nextUser;
  } catch (error) {
    console.error('Error in assignNextSupport:', error);
    throw error;
  }
};

module.exports = { assignNextSupport };
