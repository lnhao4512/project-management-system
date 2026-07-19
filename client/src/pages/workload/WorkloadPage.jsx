import { useEffect, useState } from 'react';
import { statsAPI } from '../../api';
import toast from 'react-hot-toast';
import { Loader, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const WorkloadPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkload = async () => {
      try {
        const res = await statsAPI.getWorkload();
        setData(res.data.data);
      } catch (error) {
        toast.error('Không thể tải dữ liệu khối lượng công việc');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkload();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(user => ({
    name: user.user.name,
    'Hoàn thành': user.completedTasks,
    'Đang làm': user.doingTasks,
    'Cần làm': user.todoTasks,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-50">Khối lượng công việc</h1>
        <p className="text-dark-400 text-sm mt-1">Thống kê số lượng công việc của từng nhân viên</p>
      </div>

      <div className="card p-6 min-h-[400px]">
        <h3 className="text-lg font-semibold text-dark-100 mb-6">Biểu đồ tổng quan</h3>
        <div style={{ width: '100%', height: 400, minHeight: 400 }}>
          <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
              <XAxis dataKey="name" stroke="#a0aec0" />
              <YAxis stroke="#a0aec0" allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a202c', border: 'none', borderRadius: '8px', color: '#fff' }}
                cursor={{ fill: '#2d3748', opacity: 0.4 }}
              />
              <Legend />
              <Bar dataKey="Cần làm" stackId="a" fill="#4a5568" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Đang làm" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Hoàn thành" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-dark-800">
          <h3 className="text-lg font-semibold text-dark-100">Bảng tiến độ nhân sự</h3>
        </div>
        <div className="table-wrapper">
          <table className="table w-full">
            <thead>
              <tr className="bg-dark-800/50">
                <th className="w-[20%] uppercase text-xs font-semibold tracking-wider">Nhân viên</th>
                <th className="w-[25%] uppercase text-xs font-semibold tracking-wider">Tiến độ tổng quan</th>
                <th className="w-[55%] uppercase text-xs font-semibold tracking-wider">Trạng thái các công việc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {data.map((item, idx) => {
                const percent = item.totalTasks > 0 ? Math.round((item.completedTasks / item.totalTasks) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-dark-800/20 transition-colors">
                    {/* User Info */}
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                          {item.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-dark-100 flex items-center gap-2 block">
                            {item.user.name}
                            {(item.todoTasks + item.doingTasks) > 5 && (
                              <span className="text-[9px] bg-danger-500/20 text-danger-500 border border-danger-500/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                Quá tải
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-dark-400">{item.completedTasks} / {item.totalTasks} công việc</span>
                        </div>
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-success-500' : 'bg-primary-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold w-10 text-right ${percent === 100 ? 'text-success-500' : 'text-primary-400'}`}>
                          {percent}%
                        </span>
                      </div>
                    </td>

                    {/* Task Blocks */}
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.tasks?.map((task) => {
                          // Xác định màu theo trạng thái
                          let bgColor = 'bg-danger-500'; // Todo = Đỏ
                          let label = 'Cần làm';
                          
                          if (task.status === 'done') {
                            bgColor = 'bg-success-500'; // Done = Xanh
                            label = 'Hoàn thành';
                          } else if (task.status === 'doing') {
                            bgColor = 'bg-warning-500'; // Doing = Vàng
                            label = 'Đang làm';
                          }

                          return (
                            <div 
                              key={task._id} 
                              className={`relative group cursor-pointer flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-sm ${bgColor} hover:opacity-80 transition-opacity`}
                              style={{ minWidth: '80px' }}
                            >
                              <span className="truncate max-w-[100px]">{task.title}</span>
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-dark-900 text-dark-100 text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-dark-700">
                                <p className="font-bold mb-1 truncate">{task.title}</p>
                                <p className="text-dark-400">Trạng thái: <span className={bgColor.replace('bg-', 'text-')}>{label}</span></p>
                                {task.progress !== undefined && <p className="text-dark-400">Tiến độ: {task.progress}%</p>}
                              </div>
                            </div>
                          );
                        })}
                        {(!item.tasks || item.tasks.length === 0) && (
                          <span className="text-sm text-dark-500 italic">Chưa có công việc nào</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkloadPage;
