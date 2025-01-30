import OrderItem from "../models/orderItem.js";

// List Order Items in Bulk with Proper Count Calculation
export const listOrderItemsBulk = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const perPage = Number.parseInt(req.query.per_page) || 20;
    const status = req.query.status
      ? Number.parseInt(req.query.status)
      : undefined;
    const searchQuery = req.query.search || "";
    const date = req.query.date ? new Date(req.query.date) : undefined;

    const matchQuery = {};

    if (searchQuery) {
      matchQuery.name = { $regex: new RegExp(searchQuery, "i") };
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      matchQuery.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (status !== undefined) {
      matchQuery.status = status;
    }

    const aggregationPipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "items",
          localField: "itemId",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      {
        $unwind: "$itemDetails",
      },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      {
        $unwind: "$orderDetails",
      },
      {
        $group: {
          _id: {
            itemId: "$itemId",
            shopId: "$orderDetails.shopId",
          },
          name: { $first: "$itemDetails.name" },
          category: { $first: "$itemDetails.category" },
          rate: { $first: "$itemDetails.rate" },
          shopName: { $first: "$orderDetails.shopName" },
          countPerShop: { $sum: "$count" },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$_id.itemId",
          name: { $first: "$name" },
          category: { $first: "$category" },
          rate: { $first: "$rate" },
          totalCount: { $sum: "$countPerShop" },
          shops: {
            $push: {
              shopId: "$_id.shopId",
              shopName: "$shopName",
              count: "$countPerShop",
            },
          },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          itemId: "$_id",
          name: 1,
          category: 1,
          rate: 1,
          totalCount: 1,
          shops: 1,
          createdAt: 1,
        },
      },
      {
        $facet: {
          paginatedItems: [
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const aggregatedResult = await OrderItem.aggregate(aggregationPipeline);

    const paginatedItems = aggregatedResult[0]?.paginatedItems || [];
    const totalCount = aggregatedResult[0]?.totalCount[0]?.count || 0;

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
    const date = req.query.date;

    const searchPattern = new RegExp(searchQuery, "i");

    let query = {};

    if (searchPattern) {
      query.name = { $regex: searchPattern };
    }

    if (date) {
      const specificDate = new Date(date);
      query.createdAt = {
        $gte: new Date(specificDate.setHours(0, 0, 0, 0)),
        $lt: new Date(specificDate.setHours(23, 59, 59, 999)),
      };
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
