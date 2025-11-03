export const notFoundHandler = (req, res, next) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message =
    err.message || "An unexpected error occurred. Please try again later.";
  res.status(status).json({ message });
};
