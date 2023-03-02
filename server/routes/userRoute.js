import express from 'express';
// import multer from 'multer';
import {
  signup,
  login,
  logout,
  resetPass,
  forgetPass,
  updatePassword,
  protect,
  restrictedTo,
} from '../controller/authenticationController.js';
import {
  getAllUser,
  updateMe,
  updateUserData,
  deleteMe,
  getUser,
  getMe,
  deleteUser,
  updatedUser,
  uploadUserPhoto,
  resizeUserPhoto,
} from '../controller/userController.js';
import { router as reviewsRouter } from './reviewRoute.js';

// const upload = multer({ dest: 'data/img/user' });
const router = express.Router();

router.use('/:tourId/reviews', reviewsRouter);

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgetPassword', forgetPass);
router.patch('/resetPassword/:token', resetPass);

router.use(protect);

router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.patch('/updateuser', uploadUserPhoto, resizeUserPhoto, updateUserData);
router.delete('/deleteMe', deleteMe);
router.get('/me', getMe, getUser);

router.use(restrictedTo('admin'));

router.route('/').get(getAllUser);
// router.route('/').get(getAllUser).post(createUser);
router.route('/:id').get(getUser).patch(updatedUser).delete(deleteUser);

export { router };
