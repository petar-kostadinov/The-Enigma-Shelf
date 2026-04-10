const { bookModel } = require("../models");

function getBooks(req, res, next) {
  bookModel
    .find()
    .populate("owner")
    .then((books) => res.json(books))
    .catch(next);
}

function getBook(req, res, next) {
  const { bookId } = req.params;

  bookModel
    .findById(bookId)
    .populate("owner")
    .then((book) => res.json(book))
    .catch(next);
}

function createBook(req, res, next) {
  const {
    title,
    author,
    summary,
    genre,
    rating,
    series,
  } = req.body;
  const { _id: owner } = req.user;

  bookModel
    .create({
      title,
      author,
      genre,
      rating,
      series,
      summary,
      owner,
      likes: [],
    })
    .then((book) => res.status(201).json(book))
    .catch(next);
}

function likeBook(req, res, next) {
  const { bookId } = req.params;
  const { _id: userId } = req.user;

  bookModel
    .findByIdAndUpdate(
      bookId,
      { $addToSet: { likes: userId } },
      { new: true },
    )
    .then((updatedBook) =>
      res.status(200).json(updatedBook),
    )
    .catch(next);
}

module.exports = {
  getBooks,
  createBook,
  getBook,
  likeBook,
};
