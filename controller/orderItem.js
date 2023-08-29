import OrderItem from "../models/orderItem.js";

export const listOrderItemsBulk = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;

    let aggregationPipeline = [
      {
        $group: {
          _id: "$name",
          count: { $sum: "$count" },
          order_ids: { $addToSet: "$orderId" },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          order_ids: 1,
        },
      },
      {
        $facet: {
          paginatedItems: [
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
          ],
          totalCount: [{ $group: { _id: null, totalCount: { $sum: 1 } } }],
        },
      },
    ];

    if (Object.keys(req.query).includes("status")) {
      aggregationPipeline.unshift({
        $match: {
          status: parseInt(req.query.status),
        },
      });
    }

    const aggregatedResult = await OrderItem.aggregate(aggregationPipeline);

    const paginatedItems = aggregatedResult[0].paginatedItems;
    const totalCount = aggregatedResult[0].totalCount[0]?.totalCount || 0;

    res
      .status(200)
      .json({ data: paginatedItems, page, perPage, totalCount, error: false });
  } catch (error) {
    res.status(500).json({ error, message: "Internal server error" });
  }
};

export const listOrderItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;

    const statusesToFilter = req.query.status ? [req.query.status] : [0, 1];

    const total = await OrderItem.where({
      status: { $in: statusesToFilter },
    }).countDocuments();

    const data = await OrderItem.find()
      .where({ status: { $in: statusesToFilter } })
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
