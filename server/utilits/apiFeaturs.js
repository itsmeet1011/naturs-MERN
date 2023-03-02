class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    // console.log(this.query);
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // ADVANCE FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));

    // let query = Tour.find(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // SORTING
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skips = (page - 1) * limit;

    this.query = this.query.skip(skips).limit(limit);

    // if (this.queryString.page) {
    //   const numTour = await Tour.countDocuments();
    //   if (skips >= numTour) throw new Error('This Page is not found');
    // }

    return this;
  }
}

export default APIFeatures;
