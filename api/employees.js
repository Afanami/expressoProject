// Import express files and routers
const express = require("express");
const employeeRouter = express.Router();

// Import sqlite and create DB from file
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

/* ====================== */
/* @ROUTE /api/employees/ */
/* ====================== */

// Query database and get all employed employees
employeeRouter.get("/", (req, res, next) => {
  db.all(
    "SELECT * FROM Employee WHERE Employee.is_current_employee = 1",
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({ employees });
      }
    }
  );
});

// Create employee and insert into database
employeeRouter.post("/", (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;

  // Send 400 error if required body values missing
  if (!name || !position || !wage) {
    res.sendStatus(400);
  }

  let isCurrentlyEmployed = req.body.employee.isCurrentlyEmployed;
  // Set employment status if does not exist
  if (!isCurrentlyEmployed) {
    isCurrentlyEmployed = 1;
  }

  db.run(
    "INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $pos, $wage, $employed)",
    {
      $name: name,
      $pos: position,
      $wage: wage,
      $employed: isCurrentlyEmployed
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        // Check employee inserted correctly and return as response
        db.get(
          "SELECT * FROM Employee WHERE Employee.id = $lastId",
          {
            $lastId: this.lastID
          },
          function(err, employee) {
            res.status(201).json({ employee });
          }
        );
      }
    }
  );
});

/* ================================= */
/* @ROUTE /api/employees/:employeeId */
/* ================================= */

// Set up param router to handle parameter error checking logic + existence check
employeeRouter.param("employeeId", (req, res, next, employeeId) => {
  db.get(
    "SELECT * FROM Employee WHERE Employee.id = $employeeId",
    { $employeeId: employeeId },
    (err, employee) => {
      // Error checking logic and assignment of employee to req if exists
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
});

// Retrieve employee after param route checks validity of employee
employeeRouter.get("/:employeeId", (req, res, next) => {
  const employee = req.employee;
  res.status(200).json({ employee });
});

// Update employee after param route checks validity of employee
employeeRouter.put("/:employeeId", (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
  const employeeId = req.params.employeeId;

  // Send 400 error if required body values missing
  if (!name || !position || !wage) {
    res.sendStatus(400);
  }

  let isCurrentlyEmployed = req.body.employee.isCurrentlyEmployed;
  // Set employment status if does not exist
  if (!isCurrentlyEmployed) {
    isCurrentlyEmployed = 1;
  }

  // Update employee based on id
  db.run(
    "UPDATE Employee SET name = $name, position = $pos, wage = $wage, is_current_employee = $employed WHERE Employee.id = $employeeId",
    {
      $name: name,
      $pos: position,
      $wage: wage,
      $employed: isCurrentlyEmployed,
      $employeeId: employeeId
    },
    err => {
      if (err) {
        next(err);
      } else {
        // Get updated employee and return as json response
        db.get(
          "SELECT * FROM Employee WHERE Employee.id = $employeeId",
          { $employeeId: employeeId },
          (err, employee) => {
            res.status(200).json({ employee });
          }
        );
      }
    }
  );
});

// Delete employee by setting employment to 0
employeeRouter.delete("/:employeeId", (req, res, next) => {
  const employeeId = req.params.employeeId;
  // Set employed to 0 to employee based on id
  db.run(
    "UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId",
    { $employeeId: employeeId },
    err => {
      if (err) {
        next(err);
      } else {
        // Get updated employee and send as json response
        db.get(
          "SELECT * FROM Employee WHERE Employee.id = $employeeId",
          { $employeeId: employeeId },
          (err, employee) => {
            res.status(200).json({ employee });
          }
        );
      }
    }
  );
});

// Mount timesheetsRouter to /api/employees
// @ROUTE /api/employees/:employeeId/timesheets
const timesheetsRouter = require("./timesheets");
employeeRouter.use("/:employeeId/timesheets", timesheetsRouter);

module.exports = employeeRouter;
