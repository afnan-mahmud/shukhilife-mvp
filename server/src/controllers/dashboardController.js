const Order = require('../../models/Order');
const Product = require('../../models/Product');

/**
 * Get dashboard summary metrics (admin only)
 * GET /api/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const getDashboardSummary = async (req, res) => {
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

    // Get total orders count
    const totalOrders = await Order.countDocuments(dateFilter);

    // Get status counts
    const statusCounts = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert status counts to object with default values
    const statusCountsObj = {
      pending: 0,
      on_hold: 0,
      call_not_received: 0,
      confirmed: 0,
      canceled: 0,
      completed: 0
    };

    statusCounts.forEach(item => {
      if (statusCountsObj.hasOwnProperty(item._id)) {
        statusCountsObj[item._id] = item.count;
      }
    });

    // Get product counts
    const productCounts = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$product',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          productId: '$_id',
          name: '$productInfo.name',
          count: '$count'
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      summary: {
        totalOrders,
        statusCounts: statusCountsObj,
        productCounts
      },
      dateRange: {
        from: from || null,
        to: to || null
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard summary'
    });
  }
};

module.exports = {
  getDashboardSummary
};
