const Order = require('../../models/Order');
const User = require('../../models/User');

/**
 * Get support performance report (admin only)
 * GET /api/reports/support?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const getSupportReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Build date filter
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) {
        dateFilter.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // End of day
        dateFilter.createdAt.$lte = toDate;
      }
    }

    // Get all support users
    const supportUsers = await User.find({ role: 'support' }).select('_id name email');

    // Get performance data for each support user
    const supportPerformance = await Promise.all(
      supportUsers.map(async (user) => {
        // Get all orders assigned to this support user within date range
        const userOrders = await Order.find({
          assignedTo: user._id,
          ...dateFilter
        });

        // Count orders by status
        const statusCounts = userOrders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          totalAssigned: userOrders.length,
          confirmedCount: statusCounts.confirmed || 0,
          pendingCount: statusCounts.pending || 0,
          canceledCount: statusCounts.canceled || 0,
          onHoldCount: statusCounts.on_hold || 0,
          callNotReceivedCount: statusCounts.call_not_received || 0,
          completedCount: statusCounts.completed || 0
        };
      })
    );

    // Sort by total assigned (descending)
    supportPerformance.sort((a, b) => b.totalAssigned - a.totalAssigned);

    res.json({
      success: true,
      supportPerformance,
      dateRange: {
        from: from || null,
        to: to || null
      },
      totalSupportUsers: supportUsers.length
    });
  } catch (error) {
    console.error('Get support report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching support report'
    });
  }
};

/**
 * Get current support user's performance report
 * GET /api/support/me/report?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const getMySupportReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.user._id;

    // Build date filter
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) {
        dateFilter.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // End of day
        dateFilter.createdAt.$lte = toDate;
      }
    }

    // Get user info
    const user = await User.findById(userId).select('_id name email');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all orders assigned to this support user within date range
    const userOrders = await Order.find({
      assignedTo: userId,
      ...dateFilter
    });

    // Count orders by status
    const statusCounts = userOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const myPerformance = {
      userId: user._id,
      name: user.name,
      email: user.email,
      totalAssigned: userOrders.length,
      confirmedCount: statusCounts.confirmed || 0,
      pendingCount: statusCounts.pending || 0,
      canceledCount: statusCounts.canceled || 0,
      onHoldCount: statusCounts.on_hold || 0,
      callNotReceivedCount: statusCounts.call_not_received || 0,
      completedCount: statusCounts.completed || 0
    };

    res.json({
      success: true,
      myPerformance,
      dateRange: {
        from: from || null,
        to: to || null
      }
    });
  } catch (error) {
    console.error('Get my support report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching support report'
    });
  }
};

module.exports = {
  getSupportReport,
  getMySupportReport
};
