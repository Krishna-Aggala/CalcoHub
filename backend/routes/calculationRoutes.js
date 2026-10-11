const express = require("express");
const mongoose = require("mongoose");
const Calculation = require("../models/Calculation");

const router = express.Router();

// GET: Retrieve calculation history
router.get("/", async (req, res, next) => {
  try {
    const history = await Calculation.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// POST: Save a calculation
router.post("/", async (req, res, next) => {
  try {
    const { expression, result } = req.body;

    if (
      typeof expression !== "string" ||
      expression.trim().length === 0 ||
      expression.length > 200
    ) {
      return res.status(400).json({
        message: "A valid expression is required",
      });
    }

    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {
      return res.status(400).json({
        message: "A finite numeric result is required",
      });
    }

    const calculation = await Calculation.create({
      expression: expression.trim(),
      result,
    });

    res.status(201).json(calculation);
  } catch (error) {
    next(error);
  }
});

// DELETE: Remove one calculation
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid calculation ID",
      });
    }

    const calculation = await Calculation.findByIdAndDelete(id);

    if (!calculation) {
      return res.status(404).json({
        message: "Calculation not found",
      });
    }

    res.json({
      message: "Calculation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: Remove all calculations
router.delete("/", async (req, res, next) => {
  try {
    await Calculation.deleteMany({});

    res.json({
      message: "All calculation history cleared",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;