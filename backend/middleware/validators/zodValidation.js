const { ZodError } = require("zod");
const responseHandler = require("../../utils/responseHandler");

/**
 * Validates request payload against a Zod schema
 */
const validate = (schema, source = "body") => {
    return (req, res, next) => {
        try {
            const dataToValidate = req[source];
            schema.parse(dataToValidate);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));

                return responseHandler.error(
                    res,
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    formattedErrors
                );
            }
            next(error);
        }
    };
};

module.exports = { validate };
