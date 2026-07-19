const Joi = require('joi');

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    password: Joi.string()
      .min(8)
      .max(20)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])(?!.*\s).*$/)
      .required()
      .messages({
        'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng',
        'string.min': 'Mật khẩu phải có từ 8 đến 20 ký tự',
        'string.max': 'Mật khẩu phải có từ 8 đến 20 ký tự',
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
    }),
  }),
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .max(20)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])(?!.*\s).*$/)
      .invalid(Joi.ref('currentPassword'))
      .required()
      .messages({
        'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng',
        'string.min': 'Mật khẩu phải có từ 8 đến 20 ký tự',
        'string.max': 'Mật khẩu phải có từ 8 đến 20 ký tự',
        'any.invalid': 'Mật khẩu mới không được trùng với mật khẩu cũ'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
    }),
  }),
};

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
