import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import AppError from './utilits/appError.js';
import { router as userRouter } from './routes/userRoute.js';
import { router as toursRouter } from './routes/tourRoute.js';
import { router as reviewsRouter } from './routes/reviewRoute.js';
import { globleErrHandeler } from './controller/errorController.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
// gGLOBLE MIDDLEWARE
app.use(express.static(path.join(__dirname, 'public')));
// SET SECURITY HTTP HEADERS
const corsOptions = {
  origin: true, //included origin as true
  credentials: true, //included credentials as true
};
app.use(helmet());
app.use(cors(corsOptions));

// LIMIT REQUEST FROM ONE IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request, please try again after an hour.',
});

app.use('/api', limiter);

// BODY PERSER, READING DATA FROM req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(ExpressMongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsOuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use((req, res, next) => {
  console.log('jwt', req.cookies.jwt);
  next();
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globleErrHandeler);

export default app;
