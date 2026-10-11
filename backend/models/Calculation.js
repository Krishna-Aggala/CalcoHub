const mongoose = require("mongoose");

const calculationSchema = new mongoose.Schema(
  {
    expression: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    result: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isFinite,
        message: "Result must be a finite number",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Calculation",
  calculationSchema
);