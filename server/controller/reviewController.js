import Review from '../model/reviewModel.js';
import { catchasync } from '../utilits/catchAsync.js';
import { deleteOne, updateOne, getOne } from './handelFactory.js';

export const getAllReview = catchasync(async (req, res, next) => {
  const filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
  next();
});

export const createReview = catchasync(async (req, res, next) => {
  //allow by nested routing
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReviews = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReviews,
    },
  });
  next();
});

export const getReview = getOne(Review);
export const updateReview = updateOne(Review);
export const deletReview = deleteOne(Review);
