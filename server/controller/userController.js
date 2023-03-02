import multer from 'multer';
import sharp from 'sharp';
import User from '../model/userModel.js';
import { catchasync } from '../utilits/catchAsync.js';
import AppError from '../utilits/appError.js';
import { deleteOne, updateOne, getOne } from './handelFactory.js';
import { createSendToken } from './authenticationController.js';

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log('req', file);
//     cb(null, 'public/img/users');
//   },
//   filename: function (req, file, cb) {
//     //file extention .jpg or .png
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, false);
//   } else {
//     cb(new AppError('not an image! Please upload only images', 400), false);
//   }
// };

const upload = multer({
  storage: multerStorage,
});

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = async (req, res, next) => {
  // console.log('body-im', req.body);
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // console.log('img-p', req.file.filename);

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

export const getAllUser = catchasync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

const filterObj = (obj, ...allowedField) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedField.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const updateMe = catchasync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.fileName;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

export const deleteMe = catchasync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateUserData = catchasync(async (req, res, next) => {
  // console.log('body', req.body);
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  createSendToken(updatedUser, 201, res);
});

export const getUser = getOne(User);
export const updatedUser = updateOne(User);
export const deleteUser = deleteOne(User);
