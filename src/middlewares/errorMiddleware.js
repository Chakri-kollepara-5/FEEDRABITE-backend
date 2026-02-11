const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;

    // Use the error's status code if available and valid
    const finalStatus = err.statusCode || statusCode;

    res.status(finalStatus === 200 ? 500 : finalStatus);

    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
