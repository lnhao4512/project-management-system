import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Loader } from 'lucide-react';
import { createProject, updateProject } from '../../redux/slices/projectsSlice';
import toast from 'react-hot-toast';

const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];

const ProjectFormModal = ({ project, onClose }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(project?.color || '#6366f1');

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'planning',
      priority: project?.priority || 'medium',
      startDate: project?.startDate ? new Date(project.startDate) : null,
      endDate: project?.endDate ? new Date(project.endDate) : null,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const payload = { 
      ...data, 
      color: selectedColor,
      startDate: data.startDate ? data.startDate.toISOString() : null,
      endDate: data.endDate ? data.endDate.toISOString() : null,
    };

    const action = project
      ? dispatch(updateProject({ id: project._id, data: payload }))
      : dispatch(createProject(payload));

    const res = await action;
    setLoading(false);

    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(project ? 'Đã cập nhật dự án!' : 'Đã tạo dự án!');
      onClose();
    } else {
      toast.error(res.payload || 'Thao tác thất bại');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-lg">
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-dark-100">
            {project ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body space-y-4">
            {/* Name Rules */}
            <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-xs text-primary-500 animate-fade-in">
              <p className="font-semibold mb-1">Quy định tên dự án:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Độ dài từ 3 đến 100 ký tự.</li>
                <li>Chỉ chứa chữ cái, số, khoảng trắng.</li>
                <li>Không chứa ký tự đặc biệt.</li>
                <li>Không bắt đầu/kết thúc bằng khoảng trắng.</li>
              </ul>
            </div>

            {/* Name */}
            <div>
              <label className="label">Tên dự án *</label>
              <input
                {...register('name', { 
                  required: 'Vui lòng nhập tên', 
                  minLength: { value: 3, message: 'Độ dài từ 3 đến 100 ký tự' },
                  maxLength: { value: 100, message: 'Độ dài từ 3 đến 100 ký tự' },
                  pattern: {
                    value: /^[a-zA-Z0-9ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ](?:[a-zA-Z0-9ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]*[a-zA-Z0-9ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])?$/,
                    message: 'Tên dự án không đúng quy định'
                  }
                })}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Nhập tên dự án..."
              />
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="label">Mô tả</label>
              <textarea
                {...register('description')}
                className="input h-24 resize-none"
                placeholder="Mô tả dự án..."
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Trạng thái</label>
                <select {...register('status')} className="input">
                  <option value="planning">Lập kế hoạch</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="on_hold">Tạm dừng</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
              <div>
                <label className="label">Độ ưu tiên</label>
                <select {...register('priority')} className="input">
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ngày bắt đầu</label>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      dateFormat="dd/MM/yyyy"
                      className="input w-full"
                      placeholderText="dd/MM/yyyy"
                      isClearable
                    />
                  )}
                />
              </div>
              <div>
                <label className="label">Ngày kết thúc</label>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      dateFormat="dd/MM/yyyy"
                      className="input w-full"
                      placeholderText="dd/MM/yyyy"
                      isClearable
                    />
                  )}
                />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="label">Màu dự án</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-lg transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-dark-800 ring-white scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader size={16} className="animate-spin" /> : null}
              {project ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
