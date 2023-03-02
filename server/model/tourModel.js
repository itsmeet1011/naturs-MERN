import mongoose from 'mongoose';
import slugify from 'slugify';
import validator from 'validator';
import User from './userModel.js';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, 'tour must have a name'],
      unique: true,
      trim: true,
      minLength: [5, 'a tour must have more then 5 charecter'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      require: [true, 'Atour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      require: [true, 'Atour must have a group size'],
    },
    difficulty: {
      type: String,
      require: [true, 'Atour must have a difficalty level'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuntity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      require: [true, 'tour must have a name'],
    },
    priceDiscount: {
      type: Number,
      // coustom validator
      validate: {
        validator: (val) => {
          //this only point to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount ({VALUE}) must be less than price',
      },
    },
    summary: {
      type: String,
      trim: true,
      require: [true, 'a tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      require: [true, 'a tour must have a Cover Image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    location: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Tour must belong to a guides.'],
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// MONGOOSES MIDDLEWARE
// DOCUMENT MIDDLEWARE : only run for .save() and .create()
tourSchema.pre('save', (next) => {
  this.slug = slugify.apply(this.name, { lower: true });

  next();
});

// //embadin guide data
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   next();
// });

//QUERY MIDDLEWARE
// tourSchema.pre(/^find/, (next) => {
//   //all the function start with find
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  // console.log(this instanceof mongoose.Query);
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

export default Tour;
