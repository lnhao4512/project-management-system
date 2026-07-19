const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiResponse = require('../utils/apiResponse');

// Đảm bảo thư mục uploads tồn tại, nếu không có thì tự động tạo
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu trữ và tên file tải lên
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeName = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, safeName);
  },
});

// Bộ lọc định dạng file được phép tải lên
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng file ${file.mimetype} không được hệ thống hỗ trợ`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5, // Tối đa 5 file cùng lúc
  },
});

// Trình xử lý lỗi của thư viện Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.badRequest(res, 'Dung lượng file quá lớn. Kích thước tối đa cho phép là 10MB.');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return ApiResponse.badRequest(res, 'Tải lên quá nhiều file cùng lúc. Tối đa cho phép 5 file.');
    }
    return ApiResponse.badRequest(res, err.message);
  }
  next(err);
};

module.exports = { upload, handleMulterError };
