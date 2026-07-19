import { useState, useMemo } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useNavigate } from 'react-router-dom';

const ProjectGanttChart = ({ tasks }) => {
  const navigate = useNavigate();
  const [view, setView] = useState(ViewMode.Day);

  const ganttTasks = useMemo(() => {
    return tasks.map(task => {
      const start = task.startDate ? new Date(task.startDate) : task.createdAt ? new Date(task.createdAt) : new Date();
      let end = task.deadline ? new Date(task.deadline) : new Date(start);
      
      // Gantt chart requires end date to be strictly after start date
      if (end.getTime() <= start.getTime()) {
        end.setDate(end.getDate() + 1);
      }

      // Determine colors based on status or priority
      let bgColor = '#4b5563'; // dark-500
      let progressColor = '#6366f1'; // primary-500

      if (task.status === 'done') {
        bgColor = '#064e3b'; // success dark
        progressColor = '#10b981'; // success
      } else if (task.status === 'review') {
        bgColor = '#78350f'; // warning dark
        progressColor = '#f59e0b'; // warning
      } else if (task.status === 'doing') {
        bgColor = '#1e3a8a'; // blue dark
        progressColor = '#3b82f6'; // blue
      }

      return {
        start: start,
        end: end,
        name: task.title,
        id: task._id,
        type: task.parentTask ? 'task' : 'project',
        progress: task.progress || 0,
        isDisabled: false,
        dependencies: task.parentTask ? [task.parentTask] : undefined,
        project: task.parentTask || undefined, // For grouping if library supports it
        styles: { progressColor, progressSelectedColor: progressColor, backgroundColor: bgColor, backgroundSelectedColor: bgColor },
      };
    });
  }, [tasks]);

  if (ganttTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400 bg-dark-800/50 rounded-xl border border-dark-700">
        Không có đủ dữ liệu để vẽ biểu đồ Gantt. Hãy thêm công việc.
      </div>
    );
  }

  return (
    <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-dark-100">Tiến độ tổng quan (Gantt Chart)</h3>
        <div className="flex items-center gap-2 bg-dark-900/50 p-1 rounded-lg border border-dark-700">
          {[
            { label: 'Ngày', value: ViewMode.Day },
            { label: 'Tuần', value: ViewMode.Week },
            { label: 'Tháng', value: ViewMode.Month }
          ].map(v => (
            <button
              key={v.value}
              onClick={() => setView(v.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === v.value ? 'bg-primary-600 text-white' : 'text-dark-300 hover:text-dark-100 hover:bg-dark-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-dark-700 gantt-container-custom">
        <style dangerouslySetInnerHTML={{__html: `
          .gantt-container-custom ._346cw { fill: #1f2937 !important; } /* bg-dark-800 */
          .gantt-container-custom ._2eZzQ { fill: #374151 !important; } /* text grid */
          .gantt-container-custom text { fill: #9ca3af !important; } /* text-dark-400 */
          .gantt-container-custom ._3_cOt { fill: #111827 !important; } /* header bg */
        `}} />
        <Gantt
          tasks={ganttTasks}
          viewMode={view}
          onDoubleClick={task => navigate(`/tasks/${task.id}`)}
          listCellWidth="155px"
          columnWidth={view === ViewMode.Month ? 200 : view === ViewMode.Week ? 150 : 60}
          rowHeight={45}
          barCornerRadius={6}
          handleWidth={8}
          fontFamily="inherit"
          fontSize="12px"
        />
      </div>
    </div>
  );
};

export default ProjectGanttChart;
