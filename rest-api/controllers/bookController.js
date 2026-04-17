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
    .populate({ path: "votes.user", select: "username email" })
    .then((book) => res.json(book))
    .catch(next);
}

function createBook(req, res, next) {
  const {
    title,
    author,
    summary,
    genre,
    series,
    imageUrl,
  } = req.body;
  const { _id: owner } = req.user;

  bookModel
    .create({
      title,
      author,
      genre,
      series,
      summary,
      imageUrl,
      owner,
      likes: [],
      votes: [],
    })
    .then((book) => res.status(201).json(book))
    .catch(next);
}

function likeBook(req, res, next) {
  const { bookId } = req.params;
  const { _id: userId } = req.user;

  bookModel
    .findById(bookId)
    .then((book) => {
      if (!book) {
        return Promise.reject({ status: 404, message: "Book not found" });
      }
      if (String(book.owner) === String(userId)) {
        return Promise.reject({
          status: 403,
          message: "You cannot like your own book",
        });
      }
      const alreadyLiked = book.likes.some(
        (id) => String(id) === String(userId),
      );
      const update = alreadyLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } };
      return bookModel.findByIdAndUpdate(bookId, update, { new: true });
    })
    .then((updatedBook) => {
      if (!updatedBook) {
        return Promise.reject({ status: 404, message: "Book not found" });
      }
      return bookModel
        .findById(updatedBook._id)
        .populate("owner")
        .populate({ path: "votes.user", select: "username email" });
    })
    .then((updatedBook) => res.status(200).json(updatedBook))
    .catch((err) => {
      if (err?.status) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      next(err);
    });
}

function recomputeCommunityRating(bookId) {
  return bookModel.findById(bookId).lean().then((doc) => {
    const votes = doc?.votes || [];
    const communityRating =
      votes.length > 0
        ? Math.round(
            (votes.reduce((s, v) => s + v.score, 0) / votes.length) * 10,
          ) / 10
        : null;
    return bookModel.updateOne(
      { _id: bookId },
      { $set: { communityRating } },
    );
  });
}

function rateBook(req, res, next) {
  const { bookId } = req.params;
  const score = Number(req.body?.score);
  const { _id: userId } = req.user;

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    res.status(400).json({ message: "Score must be an integer from 1 to 5" });
    return;
  }

  bookModel
    .findById(bookId)
    .then((book) => {
      if (!book) {
        return Promise.reject({ status: 404, message: "Book not found" });
      }
      if (String(book.owner) === String(userId)) {
        return Promise.reject({
          status: 403,
          message: "You cannot vote on your own book",
        });
      }
      return bookModel.updateOne(
        { _id: bookId },
        { $pull: { votes: { user: userId } } },
      );
    })
    .then(() =>
      bookModel.updateOne(
        { _id: bookId },
        { $push: { votes: { user: userId, score } } },
      ),
    )
    .then(() => recomputeCommunityRating(bookId))
    .then(() =>
      bookModel
        .findById(bookId)
        .populate("owner")
        .populate({ path: "votes.user", select: "username email" }),
    )
    .then((book) => res.status(200).json(book))
    .catch((err) => {
      if (err?.status) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      next(err);
    });
}

function updateBook(req, res, next) {
  const { bookId } = req.params;
  const { _id: userId } = req.user;
  const { title, author, summary, genre, series, imageUrl, unread } = req.body;

  bookModel
    .findById(bookId)
    .then((book) => {
      if (!book) {
        return Promise.reject({ status: 404, message: "Book not found" });
      }
      if (String(book.owner) !== String(userId)) {
        return Promise.reject({
          status: 403,
          message: "You can only edit your own books",
        });
      }
      const $set = {
        title,
        author,
        genre,
        series: series?.trim() ? series.trim() : undefined,
        summary: summary?.trim() ? summary.trim() : undefined,
        imageUrl,
      };
      if (typeof unread === "boolean") {
        $set.unread = unread;
      }
      return bookModel.findByIdAndUpdate(
        bookId,
        { $set },
        { new: true, runValidators: true },
      );
    })
    .then((updated) => {
      if (!updated) {
        return Promise.reject({ status: 404, message: "Book not found" });
      }
      return bookModel
        .findById(updated._id)
        .populate("owner")
        .populate({ path: "votes.user", select: "username email" });
    })
    .then((book) => res.status(200).json(book))
    .catch((err) => {
      if (err?.status) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      next(err);
    });
}

function deleteBook(req, res, next) {
  const { bookId } = req.params;
  const { _id: userId } = req.user;

  bookModel
    .findById(bookId)
    .then((book) => {
      if (!book) {
        return Promise.reject({ status: 404, message: "Book not found" });
      }
      if (String(book.owner) !== String(userId)) {
        return Promise.reject({
          status: 403,
          message: "You can only delete your own books",
        });
      }
      return bookModel.deleteOne({ _id: bookId });
    })
    .then(() => res.status(204).send())
    .catch((err) => {
      if (err?.status) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      next(err);
    });
}

module.exports = {
  getBooks,
  createBook,
  getBook,
  likeBook,
  rateBook,
  updateBook,
  deleteBook,
};
