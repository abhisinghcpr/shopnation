const EmailLog = require('../models/EmailLog');
const { retryEmailLog } = require('../services/emailService');

/**
 * GET /api/v1/admin/email-logs
 * List all email logs with search, filter, and pagination.
 */
const getEmailLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      eventType,
      search,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;
    if (search) {
      filter.email = { $regex: search.trim(), $options: 'i' };
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await EmailLog.countDocuments(filter);

    const logs = await EmailLog.find(filter)
      .populate('order', 'orderNumber totalAmount')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Summary stats
    const [stats] = await EmailLog.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'Sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      stats: stats || { total: 0, sent: 0, failed: 0, pending: 0 },
    });
  } catch (err) {
    console.error('[EmailLog] getEmailLogs error:', err.message);
    res.status(500).json({ message: 'Failed to fetch email logs' });
  }
};

/**
 * POST /api/v1/admin/email-logs/:id/retry
 * Retry a failed email.
 */
const retryEmail = async (req, res) => {
  try {
    const result = await retryEmailLog(req.params.id);

    if (result.skipped) {
      return res.json({ message: 'Email already sent (skipped retry)', success: true });
    }

    if (result.success) {
      return res.json({ message: 'Email resent successfully', success: true });
    }

    res.status(500).json({ message: 'Retry failed', success: false });
  } catch (err) {
    console.error('[EmailLog] retryEmail error:', err.message);
    res.status(500).json({ message: err.message || 'Retry failed' });
  }
};

/**
 * DELETE /api/v1/admin/email-logs/:id
 * Delete a single email log entry.
 */
const deleteEmailLog = async (req, res) => {
  try {
    const log = await EmailLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Email log not found' });
    res.json({ message: 'Email log deleted' });
  } catch (err) {
    console.error('[EmailLog] deleteEmailLog error:', err.message);
    res.status(500).json({ message: 'Failed to delete email log' });
  }
};

/**
 * DELETE /api/v1/admin/email-logs/clear-failed
 * Bulk delete all Failed logs.
 */
const clearFailedLogs = async (req, res) => {
  try {
    const result = await EmailLog.deleteMany({ status: 'Failed' });
    res.json({ message: `${result.deletedCount} failed log(s) cleared` });
  } catch (err) {
    console.error('[EmailLog] clearFailedLogs error:', err.message);
    res.status(500).json({ message: 'Failed to clear failed logs' });
  }
};

module.exports = { getEmailLogs, retryEmail, deleteEmailLog, clearFailedLogs };
