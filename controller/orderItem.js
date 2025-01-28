import OrderItem from "../models/orderItem.js";

// List Order Items in Bulk with Proper Count Calculation
export const listOrderItemsBulk = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const status = req.query.status ? parseInt(req.query.status) : undefined;
    const searchQuery = req.query.search || "";
    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : undefined;
    const endDate = req.query.end_date
      ? new Date(req.query.end_date)
      : undefined;

    // Initialize the query object for filtering
    let query = {};

    // Apply filters based on the query parameters
    if (searchQuery) {
      query.name = { $regex: new RegExp(searchQuery, "i") };
    }
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (status !== undefined) {
      query.status = status;
    }

    // Define the aggregation pipeline
    const aggregationPipeline = [
      { $match: query }, // Apply filtering
      {
        $group: {
          _id: "$name",
          count: { $sum: "$count" }, // Sum only valid counts
          order_ids: { $addToSet: "$orderId" }, // Ensure unique order IDs
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          order_ids: 1,
          createdAt: 1,
        },
      },
      {
        $facet: {
          paginatedItems: [
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
          ],
          totalCount: [{ $count: "totalCount" }],
        },
      },
    ];

    // Run the aggregation pipeline
    const aggregatedResult = await OrderItem.aggregate(aggregationPipeline);

    // Extract paginated items and total count from the result
    const paginatedItems = aggregatedResult[0]?.paginatedItems || [];
    const totalCount = aggregatedResult[0]?.totalCount[0]?.totalCount || 0;

    res.status(200).json({
      data: paginatedItems,
      page,
      perPage,
      totalCount,
      error: false,
    });
  } catch (error) {
    console.error("Error in listOrderItemsBulk:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
};

// List Order Items with Pagination and Filtering
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
    console.error("Error in listOrderItems:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
};

// Update Order Item Status
export const updateOrderItemStatus = async (req, res) => {
  try {
    const { from_status, to_status, name } = req.body;

    if (from_status === undefined || to_status === undefined || !name) {
      res.status(400).json({
        message: "The name, to_status, and from_status fields are required",
        error: true,
      });
      return;
    }

    // Update only existing documents with the correct status
    const result = await OrderItem.updateMany(
      { name, status: from_status },
      { $set: { status: to_status } }, // Use $set to update the status
      { new: true } // Ensures that only existing documents are modified
    );

    res.status(200).json({
      data: result,
      message: "Status updated successfully",
      error: false,
    });
  } catch (error) {
    console.error("Error in updateOrderItemStatus:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
};
