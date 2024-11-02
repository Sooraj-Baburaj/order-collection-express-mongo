import OrderItem from "../models/orderItem.js";

export const listBulkOrderItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const status = req.query.status;
    const searchQuery = req.query.search || "";
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    // Build a query object for filtering
    let query = {};

    // Search filter
    if (searchQuery) {
      query.name = { $regex: new RegExp(searchQuery, "i") };
    }

    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Status filter
    if (status) {
      query.status = parseInt(status);
    }

    // Aggregation pipeline for grouping by shop and item name
    const aggregationPipeline = [
      { $match: query }, // Apply filters first

      {
        $group: {
          _id: {
            name: "$name",
            shopName: "$shopName"
          },
          totalOrders: { $sum: "$count" }, // Sum of order count
          orderIds: { $addToSet: "$orderId" }, // Set of unique order IDs
          createdAt: { $first: "$createdAt" } // First created date (can be adjusted as needed)
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          shopName: "$_id.shopName",
          totalOrders: 1,
          orderIds: 1,
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 } // Sort by created date (newest first)
      },
      {
        $facet: {
          paginatedItems: [
            { $skip: (page - 1) * perPage },
            { $limit: perPage }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const aggregatedResult = await OrderItem.aggregate(aggregationPipeline);

    const paginatedItems = aggregatedResult[0].paginatedItems;
    const totalCount = aggregatedResult[0].totalCount[0]?.count || 0;

    // Return paginated result
    res.status(200).json({
      data: paginatedItems,
      page,
      perPage,
      totalCount,
      error: false
    });
  } catch (error) {
    console.error("Error fetching bulk order items:", error);
    res.status(500).json({
      error: true,
      message: "Internal server error"
    });
  }
};

export const listOrderItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const status = req.query.status;
    const searchQuery = req.query.search || "";
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    const searchPattern = new RegExp(searchQuery, "i");

    let query = {};

    if (searchPattern) {
      query.name = { $regex: searchPattern };
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const statusesToFilter = status ? [status] : [0, 1];

    query.status = { $in: statusesToFilter };

    const total = await OrderItem.countDocuments(query);

    const data = await OrderItem.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("-__v")
      .exec();

    res.status(200).json({ data, page, perPage, total });
  } catch (error) {
    res.status(500).json({ error, message: "Internal server error" });
  }
};

export const updateOrderItemStatus = async (req, res) => {
  try {
    if (
      req.body.from_status == undefined ||
      req.body.to_status == undefined ||
      req.body.name == undefined
    ) {
      res.status(400).json({
        message: "The name, to_status, from_status feilds are required",
        error: true,
      });
      return;
    }
    const result = await OrderItem.updateMany(
      { name: req.body.name, status: req.body.from_status },
      { status: req.body.to_status },
      { new: true }
    );

    res
      .status(200)
      .json({ data: result, message: "Status updated succesfully" });
  } catch (error) {
    res.status(500).json({ error, message: "Internal server error" });
  }
};
