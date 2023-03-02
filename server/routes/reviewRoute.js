import express from 'express';
import {
  getAllReview,
  createReview,
  deletReview,
  updateReview,
  getReview,
} from '../controller/reviewController.js';
import {
  protect,
  restrictedTo,
} from '../controller/authenticationController.js';

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReview)
  .post(protect, restrictedTo('user'), createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictedTo('user', 'admin'), updateReview)
  .delete(deletReview);

export { router };
