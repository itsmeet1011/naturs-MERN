export const catchasync = (fn) => {
  // console.log('hi');
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
