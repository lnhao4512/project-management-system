import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Search, Filter, FolderOpen, Users, Calendar, MoreVertical, Trash2, Pencil, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProjects, deleteProject } from '../../redux/slices/projectsSlice';
import { useAuth } from '../../hooks/useAuth';
import { PROJECT_STATUS_LABELS, PRIORITY_LABELS } from '../../constants';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ProjectFormModal from '../../components/projects/ProjectFormModal';

const statusClasses = {
  planning: 'bg-dark-600 text-dark-300',
  active: 'bg-success-500/20 text-success-500',
  on_hold: 'bg-warning-500/20 text-warning-500',
  completed: 'bg-primary-600/20 text-primary-400',
  cancelled: 'bg-danger-500/20 text-danger-500',
};

const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: projects, loading, pagination } = useSelector(s => s.projects);
  const { isAdminOrPM } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortOption, setSortOption] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects({
      page,
      limit,
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      sort: sortOption
    }));
  }, [dispatch, page, limit, search, statusFilter, priorityFilter, sortOption]);

  const getPageNumbers = (totalPages, currentPage) => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa dự án "${name}"? Thao tác này không thể hoàn tác.`)) return;
    const res = await dispatch(deleteProject(id));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Đã xóa dự án');
    } else {
      toast.error(res.payload || 'Xóa thất bại');
    }
  };

  const handleExport = () => {
    if (projects.length === 0) return;
    const dataToExport = projects.map(p => ({
      'Tên dự án': p.name,
      'Mô tả': p.description,
      'Trạng thái': PROJECT_STATUS_LABELS[p.status],
      'Số lượng thành viên': p.members?.length || 0,
      'Độ ưu tiên': p.priority === 'high' ? 'Cao' : p.priority === 'medium' ? 'Trung bình' : 'Thấp',
      'Ngày bắt đầu': p.startDate ? format(new Date(p.startDate), 'dd/MM/yyyy') : '',
      'Hạn chót': p.endDate ? format(new Date(p.endDate), 'dd/MM/yyyy') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Du_An');
    XLSX.writeFile(workbook, 'Danh_sach_du_an.xlsx');
    toast.success('Đã xuất file Excel');
  };

  const handleExportPDF = () => {
    if (projects.length === 0) return;
    const doc = new jsPDF();
    doc.text('Danh sach Du an', 14, 15);
    
    const tableColumn = ["Ten du an", "Trang thai", "Tien do", "Thanh vien", "Ngay bat dau", "Han chot"];
    const tableRows = [];

    projects.forEach(p => {
      const projectData = [
        removeAccents(p.name),
        removeAccents(PROJECT_STATUS_LABELS[p.status] || ''),
        `${p.progress || 0}%`,
        p.members?.length || 0,
        p.startDate ? format(new Date(p.startDate), 'dd/MM/yyyy') : '',
        p.endDate ? format(new Date(p.endDate), 'dd/MM/yyyy') : ''
      ];
      tableRows.push(projectData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save('Danh_sach_du_an.pdf');
    toast.success('Đã xuất file PDF');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Dự án</h1>
          <p className="text-dark-400 text-sm mt-1">
            Tổng cộng {pagination?.total || 0} dự án
          </p>
        </div>
        {isAdminOrPM && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-dark-50 rounded-xl border border-dark-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={projects.length === 0}
            >
              <FileText size={16} className="text-danger-400" />
              <span className="text-sm font-medium hidden sm:inline">Xuất PDF</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-dark-50 rounded-xl border border-dark-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={projects.length === 0}
            >
              <Download size={16} className="text-success-500" />
              <span className="text-sm font-medium hidden sm:inline">Xuất Excel</span>
            </button>
            <button
              onClick={() => { setEditProject(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary-500/20 transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="text-sm font-semibold">Dự án mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-dark-900/50 text-dark-100 placeholder:text-dark-400 border border-dark-700/50 rounded-xl py-2.5 pl-11 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input text-sm py-2 px-3 min-w-[150px] bg-dark-900/50"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          
          <select
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
            className="input text-sm py-2 px-3 min-w-[140px] bg-dark-900/50"
          >
            <option value="">Tất cả ưu tiên</option>
            {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={e => { setSortOption(e.target.value); setPage(1); }}
            className="input text-sm py-2 px-3 min-w-[150px] bg-dark-900/50"
          >
            <option value="-createdAt">Mới nhất</option>
            <option value="createdAt">Cũ nhất</option>
            <option value="-priority">Ưu tiên cao nhất</option>
            <option value="priority">Ưu tiên thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 space-y-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpen size={48} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-dark-300 font-semibold mb-2">Không tìm thấy dự án nào</h3>
          <p className="text-dark-500 text-sm">
            {isAdminOrPM ? 'Tạo dự án đầu tiên của bạn để bắt đầu.' : 'Bạn chưa tham gia dự án nào.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="card-hover group relative">
              <div 
                onClick={() => navigate(`/projects/${project._id}`)}
                className="block p-5 cursor-pointer"
              >
                {/* Project header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  >
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-semibold text-dark-100 truncate group-hover:text-primary-300 transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-[10px] sm:text-xs ${statusClasses[project.status] || 'bg-dark-600 text-dark-400'}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                      <span className={`badge text-[10px] sm:text-xs px-1.5 py-0.5 font-semibold ${
                        project.priority === 'high' ? 'bg-danger-500/15 text-danger-500 border-danger-500/30' : 
                        project.priority === 'medium' ? 'bg-warning-500/15 text-warning-500 border-warning-500/30' : 
                        'bg-dark-600/50 text-dark-400 border-dark-600/50'
                      }`}>
                        {PRIORITY_LABELS[project.priority] || 'Thấp'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-dark-400 line-clamp-2 mb-4">{project.description}</p>
                )}

                {/* Progress Bar (Luôn hiển thị) */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-dark-400 font-medium">Tiến độ hoàn thành</span>
                    <span className={`font-bold ${project.progress === 100 ? 'text-success-500' : 'text-primary-400'}`}>
                      {project.progress || 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? 'bg-success-500' : 'bg-primary-500'}`}
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-dark-500 mt-2">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{project.members?.length || 0} thành viên</span>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{format(new Date(project.endDate), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isAdminOrPM && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.preventDefault(); setOpenMenu(openMenu === project._id ? null : project._id); }}
                      className="btn-ghost p-1.5 rounded-lg"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === project._id && (
                      <div className="absolute right-0 top-full mt-1 w-40 card shadow-2xl z-10 py-1 animate-fade-in">
                        <button
                          onClick={() => { setEditProject(project); setShowModal(true); setOpenMenu(null); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 w-full text-left"
                        >
                          <Pencil size={14} /> Chỉnh sửa
                        </button>
                        <button
                          onClick={() => { handleDelete(project._id, project.name); setOpenMenu(null); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-danger-500 hover:bg-danger-500/10 w-full text-left"
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && projects.length > 0 && pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-dark-700/50">
          <div className="flex flex-wrap items-center gap-3 text-sm text-dark-400">
            <span>
              Hiển thị <span className="font-semibold text-dark-200">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-semibold text-dark-200">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong tổng số <span className="font-semibold text-dark-200">{pagination.total}</span> dự án
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-dark-500">| Số lượng:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-dark-800 border border-dark-700 text-dark-200 text-xs rounded-lg py-1 px-2 focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={18}>18</option>
                <option value={24}>24</option>
              </select>
              <span className="text-xs text-dark-500">/ trang</span>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-dark-700 bg-dark-800/80 text-dark-300 hover:text-dark-100 hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers(pagination.totalPages, page).map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-dark-500 text-sm">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                          : 'border border-dark-700 bg-dark-800/60 text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-dark-700 bg-dark-800/80 text-dark-300 hover:text-dark-100 hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ProjectFormModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
