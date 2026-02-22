/**
 * Standardized API response handlers
 */
const responseHandler = {
    success: (res, data, statusCode = 200) => {
        return res.status(statusCode).json({
            success: true,
            data
        });
    },

    error: (res, message, errorCode = 'INTERNAL_ERROR', statusCode = 500, details = null) => {
        const response = {
            success: false,
            error: {
                message,
                code: errorCode
            }
        };

        if (details && process.env.NODE_ENV === 'development') {
            response.error.details = details;
        }

        return res.status(statusCode).json(response);
    }
};

module.exports = responseHandler;
