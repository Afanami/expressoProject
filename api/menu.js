// Import express files and routers
const express = require("express");
const menuRouter = express.Router();

// Import sqlite and create DB from file
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

/* ================== */
/* @ROUTE /api/menus/ */
/* ================== */

// Query database and get all menus
menuRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Menu", (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ menus });
    }
  });
});

// Create menu and insert into database
menuRouter.post("/", (req, res, next) => {
  const title = req.body.menu.title;

  // Send 400 error if required body values missing
  if (!title) {
    res.sendStatus(400);
  }

  db.run(
    "INSERT INTO Menu (title) VALUES ($title)",
    { $title: title },
    function(err) {
      if (err) {
        next(err);
      } else {
        // Check menu inserted correctly and return response
        db.get(
          "SELECT * FROM Menu WHERE Menu.id = $lastId",
          {
            $lastId: this.lastID
          },
          function(err, menu) {
            res.status(201).json({ menu });
          }
        );
      }
    }
  );
});

/* ========================= */
/* @ROUTE /api/menus/:menuId */
/* ========================= */

// Set up param router to handle parameter error checking logic + existence check
menuRouter.param("menuId", (req, res, next, menuId) => {
  db.get(
    `SELECT * FROM Menu WHERE Menu.id = $menuId`,
    { $menuId: menuId },
    (err, menu) => {
      // Error checking logic and assignment of menu to req if exists
      if (err) {
        next(err);
      } else if (menu) {
        req.menu = menu;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  );
});

// Retrieve menu after param route checks validity of menu
menuRouter.get("/:menuId", (req, res, next) => {
  const menu = req.menu;
  res.status(200).json({ menu });
});

// Update menu after param route checks validity of menu
menuRouter.put("/:menuId", (req, res, next) => {
  const title = req.body.menu.title;
  const menuId = req.params.menuId;

  // Send 400 error if required body values missing
  if (!title) {
    res.sendStatus(400);
  }

  // Update menu based on id
  db.run(
    `UPDATE Menu SET title = $title WHERE Menu.id = $menuId`,
    {
      $title: title,
      $menuId: menuId
    },
    err => {
      if (err) {
        next(err);
      } else {
        // Get updated menu and return as json
        db.get(
          `SELECT * FROM Menu WHERE Menu.id = $menuId`,
          { $menuId: menuId },
          (err, menu) => {
            res.status(200).json({ menu });
          }
        );
      }
    }
  );
});

// Delete menu from database
menuRouter.delete("/:menuId", (req, res, next) => {
  const menuId = req.params.menuId;

  // If exists check to see if any menu items attached to menu
  db.get(
    `SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId`,
    { $menuId: menuId },
    (err, menuItem) => {
      // Error checking logic and check if menuItem exists on menu
      if (err) {
        next(err);
      } else if (menuItem) {
        // Cant delete if menuItem exists
        res.sendStatus(400);
      } else {
        // Delete menu if no menuItem exists
        db.run(
          `DELETE FROM Menu WHERE Menu.id = $menuId`,
          { $menuId: menuId },
          err => {
            if (err) {
              next(err);
            }
            // Send proper response code
            res.sendStatus(204);
          }
        );
      }
    }
  );
});

// Mount menuItemsRouter
// @ROUTE /api/menu/:menuId/menu-items
const menuItemsRouter = require("./menu-items");
menuRouter.use("/:menuId/menu-items", menuItemsRouter);

module.exports = menuRouter;
