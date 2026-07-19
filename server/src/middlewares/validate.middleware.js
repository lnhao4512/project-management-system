const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware kiểm tra tính hợp lệ của dữ liệu đầu vào (Joi Validation)
 * @param {Object} schema - Đối tượng Joi schema chứa luật kiểm tra cho body, query, params
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Báo cáo tất cả các lỗi thay vì chỉ báo lỗi đầu tiên gặp phải
      allowUnknown: false,
      stripUnknown: true, // Loại bỏ các trường dữ liệu rác không có trong schema
    };

    const dataToValidate = {};
    if (schema.body) dataToValidate.body = req.body;
    if (schema.query) dataToValidate.query = req.query;
    if (schema.params) dataToValidate.params = req.params;

    const { error, value } = validateObject(schema, dataToValidate, validationOptions);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''), // Xóa các dấu ngoặc kép thừa trong câu báo lỗi
      }));
      return ApiResponse.badRequest(res, 'Dữ liệu đầu vào không hợp lệ', errors);
    }

    if (value.body) req.body = value.body;
    if (value.query) req.query = value.query;
    if (value.params) req.params = value.params;

    next();
  };
};

function validateObject(schema, data, options) {
  const Joi = require('joi');
  const schemaObj = {};
  if (schema.body) schemaObj.body = schema.body;
  if (schema.query) schemaObj.query = schema.query;
  if (schema.params) schemaObj.params = schema.params;

  return Joi.object(schemaObj).validate(data, options);
}

module.exports = { validate };
