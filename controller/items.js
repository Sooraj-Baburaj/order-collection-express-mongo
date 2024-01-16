import Item from "../models/items.js";
import { capitalize } from "../utils/stringFunctions.js";

export const getItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    const item = await Item.findById(itemId);

    if (!item) {
      res.status(404).json({ message: "Item not found", error: true });
      return;
    }

    res.status(200).json({ message: "success", data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const addItem = async (req, res) => {
  try {
    if (!req.body.name) {
      res.status(400).json({ message: "Item's name is required", error: true });
    } else {
      const newItem = {
        name: capitalize(req.body.name),
      };
      if (req.body.category) {
        newItem.category = capitalize(req.body.category);
      }
      if (req.body.rate) {
        newItem.rate = req.body.rate;
      }
      const item = new Item(newItem);
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

export const updateItem = async (req, res) => {
  const itemId = req.params.id;

  try {
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (req.body.name) {
      item.name = req.body.name;
    }

    if (req.body.category) {
      item.category = req.body.category;
    }

    if (req.body.rate) {
      item.rate = req.body.rate;
    }

    const updatedItem = await item.save();

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const category = req.query.category;
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

    if (category) {
      query.category = category;
    }

    const total = await Item.countDocuments(query);

    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("-__v");

    res
      .status(200)
      .json({ data: items, total, currentPage: page, perPage, error: false });
  } catch (error) {
    console.log(error);
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

export const listCategories = async (req, res) => {
  try {
    const uniqueCategories = await Item.distinct("category");

    res.status(200).json({ categories: uniqueCategories, error: false });
  } catch (error) {
    res.status(500).json({ error, message: "Internal server error" });
  }
};
