import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader, Plus, Eye, Filter, Calendar, X, Flag, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchTasks, fetchMyTasks } from '../../redux/slices/tasksSlice';
import { useAuth } from '../../hooks/useAuth';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../constants';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, format,
  isBefore, isAfter, startOfDay
} from 'date-fns';

const getTaskStartEnd = (task) => {
  const start = task.startDate ? startOfDay(new Date(task.startDate)) : startOfDay(new Date(task.deadline || new Date()));
  const end = task.deadline ? startOfDay(new Date(task.deadline)) : startOfDay(new Date(task.startDate || new Date()));
  const actualStart = isBefore(end, start) ? end : start;
  const actualEnd = isBefore(end, start) ? start : end;
  
  return { 
    start: actualStart, 
    end: actualEnd,
    _id: task._id,
    title: task.title,
    color: task.project?.color || '#3b82f6', // default to primary blue if no project color
    original: task
  };
};

const overlaps = (task, rangeStart, rangeEnd) => {
  return !(isBefore(task.end, rangeStart) || isAfter(task.start, rangeEnd));
};

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const TimelinePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdminOrPM } = useAuth();
  const { items: allTasks, myTasks, loading } = useSelector(s => s.tasks);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  useEffect(() => {
    // Fetch a large limit of tasks to ensure we cover the calendar
    // In production, we should pass start/end date params to API to filter by month
    if (isAdminOrPM) {
      dispatch(fetchTasks({ limit: 500 }));
    } else {
      dispatch(fetchMyTasks({ limit: 500 }));
    }
  }, [dispatch, isAdminOrPM]);

  const tasksToDisplay = isAdminOrPM ? allTasks : myTasks;

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Chunk days into weeks
  const weeks = [];
  let _days = [...days];
  while (_days.length) {
    weeks.push(_days.splice(0, 7));
  }

  const filteredTasks = useMemo(() => {
    return tasksToDisplay.filter(t => {
      const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
      const matchesAssignee = assigneeFilter ? t.assignedTo?._id === assigneeFilter : true;
      return matchesPriority && matchesAssignee;
    });
  }, [tasksToDisplay, priorityFilter, assigneeFilter]);

  const uniqueAssignees = useMemo(() => {
    const list = [];
    const map = new Map();
    tasksToDisplay.forEach(t => {
      if (t.assignedTo && !map.has(t.assignedTo._id)) {
        map.set(t.assignedTo._id, true);
        list.push(t.assignedTo);
      }
    });
    return list;
  }, [tasksToDisplay]);

  // Process tasks for calendar
  const processedTasks = useMemo(() => {
    return filteredTasks.map(getTaskStartEnd);
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const todoCount = filteredTasks.filter(t => t.status === 'todo').length;
  const doingCount = filteredTasks.filter(t => t.status === 'doing').length;
  const reviewCount = filteredTasks.filter(t => t.status === 'review').length;
  const doneCount = filteredTasks.filter(t => t.status === 'done').length;
  const totalCount = filteredTasks.length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 w-full">
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 w-full">
          <span className="text-dark-400 text-sm font-medium flex items-center gap-1.5 whitespace-nowrap pl-2">
            <Filter size={14} /> Bộ lọc:
          </span>
          {isAdminOrPM && (
            <select 
              className="bg-dark-900 border border-dark-700 text-dark-200 text-sm rounded-lg py-1.5 px-3 min-w-[140px] focus:outline-none"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">Tất cả phụ trách</option>
              {uniqueAssignees.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          )}
          <select 
            className="bg-dark-900 border border-dark-700 text-dark-200 text-sm rounded-lg py-1.5 px-3 min-w-[140px] focus:outline-none"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">Tất cả mức độ</option>
            <option value="high">Cao</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-6 overflow-x-auto pb-1 custom-scrollbar">
          <h1 className="text-xl font-bold text-dark-50 whitespace-nowrap">Lịch Biểu</h1>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-primary-500 text-white whitespace-nowrap shadow-md shadow-primary-500/20 hover:bg-primary-400 transition-colors">Tất cả ({totalCount})</button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-lg bg-warning-500/10 border border-warning-500/30 text-warning-500 hover:bg-warning-500/20 whitespace-nowrap transition-colors">Cần làm ({todoCount})</button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 whitespace-nowrap transition-colors">Đang làm ({doingCount})</button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-500 hover:bg-danger-500/20 whitespace-nowrap transition-colors">Chờ duyệt ({reviewCount})</button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-lg bg-success-500/10 border border-success-500/30 text-success-500 hover:bg-success-500/20 whitespace-nowrap transition-colors">Hoàn thành ({doneCount})</button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handlePrevMonth} className="p-1.5 border border-primary-500/30 rounded-lg text-primary-400 hover:bg-primary-500/10 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-dark-100 font-bold whitespace-nowrap">Tháng {format(currentMonth, 'M yyyy')}</span>
          <button onClick={handleNextMonth} className="p-1.5 border border-primary-500/30 rounded-lg text-primary-400 hover:bg-primary-500/10 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex-1 flex flex-col bg-dark-900 border border-dark-700/50 rounded-xl overflow-hidden shadow-lg min-h-[700px]">

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col bg-dark-950">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-dark-700/50 bg-dark-950">
          {WEEKDAYS.map(day => (
            <div key={day} className="py-3 text-center text-[13px] font-bold text-dark-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentMonth.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
          {weeks.map((week, weekIdx) => {
            const weekStart = week[0];
            const weekEnd = week[6];

            // Tasks overlapping this week
            const weekTasks = processedTasks.filter(t => overlaps(t, weekStart, weekEnd));
            
            // Sort by start date, then by duration
            weekTasks.sort((a, b) => a.start.getTime() - b.start.getTime() || (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime()));

            // Assign tracks to prevent vertical overlap
            const tracks = [];
            weekTasks.forEach(task => {
              let trackIdx = 0;
              while (true) {
                if (!tracks[trackIdx]) {
                  tracks[trackIdx] = [task];
                  task._track = trackIdx;
                  break;
                }
                const hasOverlap = tracks[trackIdx].some(t => overlaps(t, task.start, task.end));
                if (!hasOverlap) {
                  tracks[trackIdx].push(task);
                  task._track = trackIdx;
                  break;
                }
                trackIdx++;
              }
            });

            const maxTrack = tracks.length;

            return (
              <div key={weekIdx} className="grid grid-cols-7 flex-1 border-b border-dark-700/50 last:border-b-0">
                {week.map(day => {
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());
                  
                  // Collect tasks for this day by track
                  const dayTasksByTrack = new Array(maxTrack).fill(null);
                  weekTasks.forEach(t => {
                    if (overlaps(t, day, day)) {
                      dayTasksByTrack[t._track] = t;
                    }
                  });

                  return (
                    <div 
                      key={day.toString()} 
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[140px] border-r border-dark-700/50 last:border-r-0 flex flex-col p-1 cursor-pointer hover:bg-dark-800/40 transition-colors ${
                        isToday ? 'bg-primary-500/10 border-2 border-primary-500 relative z-20 shadow-sm' : 
                        !isCurrentMonth ? 'bg-dark-950/40' : 'bg-dark-900'
                      }`}
                    >
                      {/* Date Header */}
                      <div className="flex justify-between items-start mb-2 px-1 pt-1">
                        <div className={`flex items-center gap-2 ${isToday ? 'text-primary-500' : 'text-dark-600'}`}>
                          <Plus size={14} className="cursor-pointer hover:text-primary-400 transition-colors" />
                          <Eye size={14} className="cursor-pointer hover:text-primary-400 transition-colors" />
                        </div>
                        {isToday && (
                          <span className="text-[10px] font-bold text-primary-600 bg-primary-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
                            Hôm nay
                          </span>
                        )}
                        <span className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full ${
                          isToday ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 ml-auto' : 'text-dark-300'
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Tasks Container */}
                      <div className="flex flex-col gap-1 pb-2">
                        {dayTasksByTrack.map((t, idx) => {
                          if (!t) return <div key={idx} className="h-[22px]" />; // Spacer
                          
                          const isStart = isSameDay(t.start, day) || day.getDay() === 0; // 0 is Sunday
                          const isEnd = isSameDay(t.end, day) || day.getDay() === 6; // 6 is Saturday

                          const tOrg = t.original;
                          const isDone = tOrg.status === 'done';
                          
                          let statusColor = 'border-dark-500';
                          let avatarColor = 'bg-dark-600';
                          if (tOrg.status === 'todo') { statusColor = 'border-warning-500'; avatarColor = 'bg-warning-500'; }
                          if (tOrg.status === 'doing') { statusColor = 'border-blue-500'; avatarColor = 'bg-blue-500'; }
                          if (tOrg.status === 'review') { statusColor = 'border-danger-500'; avatarColor = 'bg-danger-500'; }
                          if (tOrg.status === 'done') { statusColor = 'border-success-500'; avatarColor = 'bg-success-500'; }

                          return (
                            <div 
                              key={idx} 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                navigate(`/tasks/${tOrg._id}`);
                              }}
                              className={`h-[26px] text-[11px] flex items-center px-1.5 cursor-pointer hover:bg-dark-700 transition-colors relative ${isStart ? 'rounded-l-md mx-0.5' : '-ml-px z-10'} ${isEnd ? 'rounded-r-md mx-0.5' : '-mr-px z-10'} ${isStart ? `border-l-4 ${statusColor}` : ''} bg-dark-800/80`}
                              title={`${t.title}`}
                            >
                              {isStart && (
                                <div className="flex w-full items-center justify-between gap-1 overflow-hidden h-full">
                                  <span className={`truncate ${isDone ? 'line-through text-dark-500 italic' : 'text-dark-200 font-medium'}`}>
                                    {t.title}
                                  </span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${avatarColor}`}>
                                      {tOrg.assignedTo?.name?.charAt(0).toUpperCase() || 'NA'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          </motion.div>
        </AnimatePresence>
      </div>
      </div>

      {/* Day Details Modal */}
      <AnimatePresence>
      {selectedDay && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" 
          onClick={() => setSelectedDay(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-dark-900 border border-primary-500/30 rounded-xl w-[500px] max-w-full overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-950">
              <div className="flex items-center gap-2 text-primary-400">
                <Calendar size={20} />
                <h3 className="text-lg font-bold">
                  Công việc ngày {format(selectedDay, 'dd/MM/yyyy')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3 bg-dark-900">
              {(() => {
                const dayTasks = processedTasks.filter(t => overlaps(t, selectedDay, selectedDay));
                
                if (dayTasks.length === 0) {
                  return <div className="text-center text-dark-500 py-8">Không có công việc nào trong ngày này</div>;
                }

                return dayTasks.map((t, idx) => {
                  const tOrg = t.original;
                  let statusColor = 'border-dark-500';
                  if (tOrg.status === 'todo') statusColor = 'border-warning-500';
                  if (tOrg.status === 'doing') statusColor = 'border-blue-500';
                  if (tOrg.status === 'review') statusColor = 'border-danger-500';
                  if (tOrg.status === 'done') statusColor = 'border-success-500';

                  return (
                    <div 
                      key={idx} 
                      onClick={() => navigate(`/tasks/${tOrg._id}`)}
                      className={`bg-dark-800/80 rounded-lg p-3.5 border-l-4 ${statusColor} hover:bg-dark-800 transition-colors shadow-sm cursor-pointer`}
                    >
                      <h4 className={`font-bold text-[15px] mb-2 ${tOrg.status === 'done' ? 'line-through text-dark-500' : 'text-dark-100'}`}>
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-dark-400">
                        <span className="flex items-center gap-1.5">
                          <Flag size={12} className={tOrg.priority === 'high' ? 'text-danger-500' : tOrg.priority === 'medium' ? 'text-warning-500' : 'text-success-500'} />
                          {PRIORITY_LABELS[tOrg.priority]}
                        </span>
                        <span className="text-dark-600">•</span>
                        <span className={tOrg.status === 'done' ? 'text-success-500 font-medium' : tOrg.status === 'doing' ? 'text-blue-500' : 'text-warning-500'}>
                          {STATUS_LABELS[tOrg.status]}
                        </span>
                        <span className="text-dark-600">•</span>
                        <span className="flex items-center gap-1.5">
                          <User size={12} />
                          {tOrg.assignedTo?.name || 'Chưa giao'}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskFormModal 
          task={editingTask} 
          onClose={() => {
            setEditingTask(null);
            if (isAdminOrPM) {
              dispatch(fetchTasks({ limit: 500 }));
            } else {
              dispatch(fetchMyTasks({ limit: 500 }));
            }
          }} 
        />
      )}

    </div>
  );
};

export default TimelinePage;
