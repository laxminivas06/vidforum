"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendPaginated = sendPaginated;
exports.sendError = sendError;
function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}
function sendPaginated(res, data, page, limit, total, message) {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}
function sendError(res, message, statusCode = 400, errorCode, details) {
    return res.status(statusCode).json({
        success: false,
        message,
        error: {
            code: errorCode,
            details,
        },
    });
}
