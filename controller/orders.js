import OrderItem from "../models/orderItem.js";

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
          _id: "$itemId",
          name: { $first: "$itemDetails.name" },
          category: { $first: "$itemDetails.category" },
          rate: { $first: "$itemDetails.rate" },
          totalCount: { $sum: "$count" },
          order_ids: { $addToSet: "$orderId" },
          shops: { $addToSet: "$orderDetails.shopId" },
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
          order_ids: 1,
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
