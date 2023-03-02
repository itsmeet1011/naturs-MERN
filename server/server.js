import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { tour } from './data/importData.js';
import Tour from './model/tourModel.js';
import { user } from './data/importUser.js';
import User from './model/userModel.js';
import { review } from './data/review.js';
import Review from './model/reviewModel.js';

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('UNHANDLER REJECTION!!  Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

dotenv.config({ path: './config.env' });
import app from './app.js';

let server;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection seccessful!');
    const PORT = process.env.PORT || 8000;
    server = app.listen(PORT, () => {
      console.log(`app runing on port ${PORT}...`);
    });

    // Tour.insertMany(tour);
    // User.insertMany(user);
    // Review.insertMany(review);
  });

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('UNHANDLER REJECTION!!  Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
