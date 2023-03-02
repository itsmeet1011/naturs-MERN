import express from 'express';
import {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getTourWithin,
  getDistances,
  resizeTourImages,
  uploadTourImages,
} from '../controller/tourController.js';
import {
  protect,
  restrictedTo,
} from '../controller/authenticationController.js';

const router = express.Router();

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictedTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getTourWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictedTo('admin'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictedTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictedTo('admin', 'lead-guide'), deleteTour);

export { router };
