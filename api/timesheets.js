// Import express files and routers
const express = require("express");
const timesheetsRouter = express.Router({ mergeParams: true });

// Import sqlite and create DB from file
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

// Employee exists middleware
const validateEmployee = (req, res, next) => {
  const employeeId = req.params.employeeId;
  // Check Employee exists
  db.get(
    "SELECT * FROM Employee WHERE Employee.id = $employeeId",
    { $employeeId: employeeId },
    (err, employee) => {
      if (err) {
        next(err);
      } else if (employee) {
        req.employee = employee;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  );
};
/* ============================================= */
/* @ROUTE /api/employees/:employeeId/timesheets/ */
/* ============================================= */

// Get all timesheets with corresponding employee id
timesheetsRouter.get("/", validateEmployee, (req, res, next) => {
  const employeeId = req.params.employeeId;
  db.all(
    "SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId",
    { $employeeId: employeeId },
    (err, timesheets) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({ timesheets });
      }
    }
  );
});

// Post a timesheet to an employee
timesheetsRouter.post("/", validateEmployee, (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.params.employeeId;

  // Send 400 error if required body values missing
  if (!hours || !rate || !date) {
    res.sendStatus(400);
  }

  db.run(
    `INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)`,
    {
      $hours: hours,
      $rate: rate,
      $date: date,
      $employeeId: employeeId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        // Get timesheet and return as response
        db.get(
          "SELECT * FROM Timesheet WHERE Timesheet.id = $lastId",
          {
            $lastId: this.lastID
          },
          function(err, timesheet) {
            res.status(201).json({ timesheet });
          }
        );
      }
    }
  );
});

/* ========================================================= */
/* @ROUTE /api/employees/:employeeId/timesheets/:timesheetId */
/* ========================================================= */

// Set up param router to handle parameter
timesheetsRouter.param("timesheetId", (req, res, next, timesheetId) => {
  db.get(
    "SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId",
    { $timesheetId: timesheetId },
    (err, timesheet) => {
      // Error checking logic and assignment of timesheet to req if exists
      if (err) {
        next(err);
      } else if (timesheet) {
        req.timesheet = timesheet;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  );
});

// Update a timesheet of an employee
timesheetsRouter.put("/:timesheetId", validateEmployee, (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.params.employeeId;
  const timesheetId = req.params.timesheetId;

  // Send 400 error if required body values missing
  if (!hours || !rate || !date) {
    res.sendStatus(400);
  }

  // Update timesheet
  db.run(
    "UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId",
    {
      $hours: hours,
      $rate: rate,
      $date: date,
      $employeeId: employeeId,
      $timesheetId: timesheetId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        // Get timesheet and return as response
        db.get(
          "SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId",
          { $timesheetId: timesheetId },
          function(err, timesheet) {
            res.status(200).json({ timesheet });
          }
        );
      }
    }
  );
});

// Delete timesheet
timesheetsRouter.delete("/:timesheetId", validateEmployee, (req, res, next) => {
  const timesheetId = req.params.timesheetId;

  db.run(
    `DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId`,
    { $timesheetId: timesheetId },
    err => {
      if (err) {
        next(err);
      }
      res.sendStatus(204);
    }
  );
});

module.exports = timesheetsRouter;
