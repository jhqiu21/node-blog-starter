export const notFound = (req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Server Error';
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(status).json({ message });
};
