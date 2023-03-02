import jwt from 'jsonwebtoken';
import util from 'util';
import crypto from 'crypto';
import User from '../model/userModel.js';
import { catchasync } from '../utilits/catchAsync.js';
import AppError from '../utilits/appError.js';
import bcryptjs from 'bcryptjs';
import sendEmail from '../utilits/email.js';

const correctPassword = async function (candidatePassword, userPassword) {
  const condition = await bcryptjs.compare(candidatePassword, userPassword);
  console.log(condition);

  return await bcryptjs.compare(candidatePassword, userPassword);
};

const changedPasswordAfter = (JWTTimestamp, user) => {
  if (user.passwordChangedAt) {
    const changedPassWord = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedPassWord;
  }
  return false;
};

const tokenCreate = function (user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const createSendToken = (user, statusCode, res) => {
  const token = tokenCreate(user);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;
  console.log('jwt');
  res.cookie('jwt', token, cookieOption);
  // remove Password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const createPasswordResetToken = (user) => {
  const resetToken = crypto.randomBytes(32).toString('hex');

  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // console.log(resetToken, user.passwordResetToken);
  return resetToken;
};

export const signup = catchasync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
  // const token = tokenCreate(newUser);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

export const login = catchasync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError('Please proovide email & password', 401));
  }

  const user = await User.findOne({ email }).select('+password');

  const correct = await correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);

  // const token = tokenCreate(user);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

export const protect = catchasync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (res.cookies.jwt) {
    token = res.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(`you are not logged in! please log in to access.`, 401)
    );
  }

  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError(`The user no longer exist.`, 401));
  }

  if (changedPasswordAfter(decoded.iat, currentUser)) {
    return next(
      new AppError('User resently change Password! Please login again.', 401)
    );
  }

  req.user = currentUser;
  next();
});

//only for render pages no error(pug)
export const isLoggedIn = async (req, res, next) => {
  if (res.cookies.jwt) {
    try {
      //verify token
      const decoded = await util.promisify(jwt.verify)(
        res.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      if (changedPasswordAfter(decoded.iat, currentUser)) {
        return next();
      }

      //there is logged in user
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
};

export const restrictedTo = (...roles) => {
  //role is a Array, accsesable duje to closer
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const forgetPass = catchasync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User not find.', 404));
  }
  const resetToken = createPasswordResetToken(user);
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forget your password? Submit a PATCH request with your new password and password confirm to: ${resetURL}. \nIf you don't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: '',
    });

    res.status(200).json({
      status: 'success',
      message: 'passwor reset token sent to your email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(`err is: ${err}`);

    return next(
      new AppError(
        'There was an error sending the email. try again later!',
        500
      )
    );
  }
});

export const resetPass = catchasync(async (req, res, next) => {
  // 1) Get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);

  // const token = tokenCreate(user);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

export const updatePassword = catchasync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT

  createSendToken(user, 200, res);
});
