const Task = require('../tasks/task.model');
const { differenceInCalendarDays, differenceInHours } = require('date-fns');

/**
 * AI Task Priority Engine
 * Scores tasks based on: priority, deadline urgency, progress, and status
 * Returns ranked suggestions with natural-language explanations (Vietnamese)
 */
class AIService {
  /**
   * Calculate urgency score for a single task
   * Higher score = more urgent to do NOW
   */
  _scoreTask(task, now = new Date()) {
    let score = 0;
    const reasons = [];
    const warnings = [];

    // ── 1. Priority Score ─────────────────────────────────────────────────────
    const priorityScores = { high: 80, medium: 40, low: 15 };
    const priorityScore = priorityScores[task.priority] || 20;
    score += priorityScore;

    const priorityLabels = { high: 'Ưu tiên cao', medium: 'Ưu tiên trung bình', low: 'Ưu tiên thấp' };

    // ── 2. Deadline Urgency Score ─────────────────────────────────────────────
    let deadlineScore = 0;
    let deadlineLabel = '';

    if (task.deadline) {
      const daysLeft = differenceInCalendarDays(new Date(task.deadline), now);
      const hoursLeft = differenceInHours(new Date(task.deadline), now);

      if (hoursLeft < 0) {
        // Overdue
        const overdueDays = Math.abs(daysLeft);
        deadlineScore = 300 + Math.min(overdueDays * 15, 150); // Cap bonus at 150
        deadlineLabel = `⏰ Quá hạn ${overdueDays > 0 ? overdueDays + ' ngày' : 'hôm nay'}`;
        warnings.push(`Công việc này đã quá hạn ${overdueDays > 0 ? overdueDays + ' ngày' : ''}. Cần xử lý ngay!`);
      } else if (daysLeft === 0) {
        deadlineScore = 250;
        deadlineLabel = '🔴 Đến hạn hôm nay';
        warnings.push('Deadline ngay hôm nay! Cần hoàn thành trước cuối ngày.');
      } else if (daysLeft === 1) {
        deadlineScore = 200;
        deadlineLabel = '🔴 Còn 1 ngày';
        warnings.push('Chỉ còn 1 ngày để hoàn thành. Tập trung ngay bây giờ!');
      } else if (daysLeft <= 3) {
        deadlineScore = 150;
        deadlineLabel = `🟠 Còn ${daysLeft} ngày`;
        reasons.push(`Deadline sắp tới trong ${daysLeft} ngày.`);
      } else if (daysLeft <= 7) {
        deadlineScore = 90;
        deadlineLabel = `🟡 Còn ${daysLeft} ngày`;
        reasons.push(`Cần hoàn thành trong tuần này (${daysLeft} ngày).`);
      } else if (daysLeft <= 14) {
        deadlineScore = 40;
        deadlineLabel = `🟢 Còn ${daysLeft} ngày`;
        reasons.push(`Còn ${daysLeft} ngày, nên bắt đầu sớm.`);
      } else {
        deadlineScore = 10;
        deadlineLabel = `📅 Còn ${daysLeft} ngày`;
      }
    } else {
      deadlineScore = 5; // No deadline = low urgency
      deadlineLabel = '📅 Chưa có deadline';
    }

    score += deadlineScore;

    // ── 3. Progress Penalty (low progress + near deadline = more urgent) ───────
    const progress = task.progress || 0;
    const remainingWork = 100 - progress;

    if (task.deadline) {
      const daysLeft = differenceInCalendarDays(new Date(task.deadline), now);
      // If little time left but much work remaining = very urgent
      if (daysLeft <= 3 && remainingWork > 60) {
        score += 50;
        warnings.push(`Chỉ hoàn thành được ${progress}% nhưng chỉ còn ${Math.max(daysLeft, 0)} ngày — cần đẩy nhanh tiến độ!`);
      } else if (daysLeft <= 7 && remainingWork > 80) {
        score += 30;
        reasons.push(`Tiến độ còn chậm (${progress}%), cần tăng tốc để kịp deadline.`);
      }
    }

    // ── 4. Status Bonus ───────────────────────────────────────────────────────
    let statusBonus = 0;
    if (task.status === 'review') {
      statusBonus = 25;
      reasons.push('Đang chờ duyệt — có thể cần hành động thêm.');
    } else if (task.status === 'doing') {
      statusBonus = 15;
      reasons.push('Đang thực hiện — tiếp tục duy trì momentum.');
    } else if (task.status === 'todo') {
      statusBonus = 0; // neutral
    }
    score += statusBonus;

    // ── 5. Build reasoning string ─────────────────────────────────────────────
    const allReasons = [...warnings, ...reasons];

    // Priority explanation
    if (task.priority === 'high') {
      allReasons.unshift('Đây là công việc ưu tiên cao.');
    }

    // If no specific reason was generated, add a generic one
    if (allReasons.length === 0) {
      allReasons.push('Công việc này nên được xem xét sớm.');
    }

    return {
      task,
      score,
      deadlineLabel,
      priorityLabel: priorityLabels[task.priority],
      urgencyLevel: this._getUrgencyLevel(score),
      reasoning: allReasons,
      progressPercent: progress,
    };
  }

  /**
   * Map score → urgency level label + color class
   */
  _getUrgencyLevel(score) {
    if (score >= 350) return { label: 'Khẩn cấp', color: 'danger', emoji: '🔴' };
    if (score >= 200) return { label: 'Rất gấp', color: 'warning', emoji: '🟠' };
    if (score >= 100) return { label: 'Quan trọng', color: 'primary', emoji: '🟡' };
    if (score >= 50)  return { label: 'Bình thường', color: 'success', emoji: '🟢' };
    return { label: 'Có thể đợi', color: 'neutral', emoji: '⚪' };
  }

  /**
   * Main method: Get AI task suggestions for a user
   */
  async getSuggestedTasks(user, limit = 5) {
    const userFilter = user.role === 'employee'
      ? { assignedTo: user._id }
      : {};

    // Fetch all non-done, non-deleted tasks
    const tasks = await Task.find({
      isDeleted: false,
      status: { $ne: 'done' },
      ...userFilter,
    })
      .populate('project', 'name color')
      .populate('assignedTo', 'name')
      .lean();

    if (!tasks.length) {
      return {
        suggestions: [],
        summary: {
          totalPending: 0,
          urgentCount: 0,
          overdueCount: 0,
          insight: 'Không có công việc nào đang chờ xử lý. Tuyệt vời! 🎉',
        },
      };
    }

    const now = new Date();

    // Score all tasks
    const scored = tasks.map(task => this._scoreTask(task, now));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Top suggestions
    const suggestions = scored.slice(0, limit).map(s => ({
      _id: s.task._id,
      title: s.task.title,
      status: s.task.status,
      priority: s.task.priority,
      deadline: s.task.deadline,
      progress: s.progressPercent,
      project: s.task.project,
      assignedTo: s.task.assignedTo,
      score: Math.round(s.score),
      urgencyLevel: s.urgencyLevel,
      deadlineLabel: s.deadlineLabel,
      priorityLabel: s.priorityLabel,
      reasoning: s.reasoning,
    }));

    // Build summary insight
    const overdueCount = tasks.filter(t => t.deadline && new Date(t.deadline) < now).length;
    const urgentCount = scored.filter(s => s.score >= 200).length;
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;

    let insight = '';
    if (overdueCount > 0) {
      insight = `⚠️ Có ${overdueCount} công việc quá hạn — cần giải quyết ngay lập tức!`;
    } else if (urgentCount > 0) {
      insight = `🎯 Có ${urgentCount} công việc rất gấp trong tuần này. Tập trung vào những việc đầu tiên!`;
    } else if (highPriorityCount > 0) {
      insight = `📋 Có ${highPriorityCount} công việc ưu tiên cao đang chờ bạn. Hãy bắt đầu ngay!`;
    } else {
      insight = `✅ Mọi thứ trong tầm kiểm soát! Hãy tiếp tục duy trì tiến độ tốt này.`;
    }

    return {
      suggestions,
      summary: {
        totalPending: tasks.length,
        urgentCount,
        overdueCount,
        highPriorityCount,
        insight,
      },
    };
  }
}

module.exports = new AIService();
