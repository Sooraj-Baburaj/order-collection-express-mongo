import Item from "../models/items.js";

export const addItem = async (req, res) => {
  try {
    if (!req.body.name) {
      res.status(400).json({ message: "Item's name is required", error: true });
    } else {
      const item = new Item({
        name: req.body.name,
      });
      await item.save();
      res.status(200).json({ message: "success", item, error: false });
    }
  } catch (error) {
    if (error?.code === 11000) {
      res.status(400).json({ message: "Item already exists!", error: true });
    } else {
      res.status(500).json({ error });
    }
  }
};

export const listItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if 'page' is not provided
    const perPage = parseInt(req.query.per_page) || 20; // Default to 10 items per page if 'per_page' is not provided

    const total = await Item.countDocuments();

    const items = await Item.find()
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("-__v");

    res
      .status(200)
      .json({ data: items, total, currentPage: page, perPage, error: false });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    const deletedItem = await Item.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found", error: true });
    }

    res
      .status(200)
      .json({ message: "Item deleted successfully", error: false });
  } catch (error) {
    res.status(500).json({ error });
  }
};
