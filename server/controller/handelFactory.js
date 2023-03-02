import { catchasync } from '../utilits/catchAsync.js';
import AppError from '../utilits/appError.js';

export const deleteOne = (model) =>
  catchasync(async (req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = (model) =>
  catchasync(async (req, res, next) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No Document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const createOne = (model) =>
  catchasync(async (req, res, next) => {
    const doc = await model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const getOne = (model, popOption) =>
  catchasync(async (req, res, next) => {
    let query = model.findById(req.params.id);

    if (popOption) query = query.populate(popOption);

    const doc = await query;

    // console.log(doc);
    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

export const getAll = (Model) =>
  catchasync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
