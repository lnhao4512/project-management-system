require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const taskService = require('./src/modules/tasks/task.service');
const AppError = require('./src/utils/appError');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    const taskId = '6a3cfe3cd7dbf93446bf1e36';
    
    // Call remindTask with a mock user
    try {
      await taskService.remindTask(taskId, { _id: new mongoose.Types.ObjectId(), name: 'System Admin' });
      console.log("Success");
    } catch (err) {
      if (err instanceof AppError) {
        console.error(`AppError: ${err.statusCode} - ${err.message}`);
      } else {
        console.error("Unknown Error:", err.message, err.stack);
      }
    }
  } catch (err) {
    console.error("DB Connect Error:", err);
  } finally {
    mongoose.disconnect();
  }
}

debug();
