const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, required: true },
    rating: { type: Number },
    series: { type: String },
    summary: { type: String },
    imageUrl: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    votes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        score: { type: Number, min: 1, max: 5, required: true },
      },
    ],
    communityRating: { type: Number },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "Book",
  bookSchema,
);
