const express = require('express');
const router = express.Router();
const { auth } = require('../utils');
const { bookController } = require('../controllers');

router.get('/', bookController.getBooks);

router.post('/', auth(), bookController.createBook);

router.get('/:bookId', bookController.getBook);

router.put('/:bookId', auth(), bookController.updateBook);

router.delete('/:bookId', auth(), bookController.deleteBook);

router.put('/:bookId/like', auth(), bookController.likeBook);

router.put('/:bookId/vote', auth(), bookController.rateBook);

// Тук по-късно ще добавим маршрута за коментари
// router.post('/:bookId/comments', auth(), bookController.addComment);

module.exports = router;