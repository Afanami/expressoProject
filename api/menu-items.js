// Import express files and routers
const express = require("express");
const menuItemsRouter = express.Router({ mergeParams: true });

// Import sqlite and create DB from file
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

// Menu exists middleware
const validateMenu = (req, res, next) => {
  const menuId = req.params.menuId;
  // Check Menu exists
  db.get(
    "SELECT * FROM Menu WHERE Menu.id = $menuId",
    { $menuId: menuId },
    (err, menu) => {
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
};

/* ===================================== */
/* @ROUTE /api/menus/:menuId/menu-items/ */
/* ===================================== */

// Get all menu items with corresponding menu id
menuItemsRouter.get("/", validateMenu, (req, res, next) => {
  const menuId = req.params.menuId;
  db.all(
    `SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId`,
    { $menuId: menuId },
    (err, menuItems) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({ menuItems });
      }
    }
  );
});

// Post a menu item to a menu
menuItemsRouter.post("/", validateMenu, (req, res, next) => {
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description; // Not required
  const inventory = req.body.menuItem.inventory;
  const price = req.body.menuItem.price;
  const menuId = req.params.menuId;
  const menuTitle = req.menu.title;

  // Send 400 error if required body values missing
  if (!name || !inventory || !price || !menuId || !menuTitle) {
    res.sendStatus(400);
  }

  db.run(
    "INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $desc, $inventory, $price, $menuId)",
    {
      $name: name,
      $desc: description,
      $inventory: inventory,
      $price: price,
      $menuId: menuId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        // Get MenuItem and return response
        db.get(
          "SELECT * FROM MenuItem WHERE MenuItem.id = $lastId",
          {
            $lastId: this.lastID
          },
          function(err, menuItem) {
            res.status(201).json({ menuItem });
          }
        );
      }
    }
  );
});

/* ================================================ */
/* @ROUTE /api/menus/:menuId/menu-items/:menuItemId */
/* ================================================ */

// Set up param router to handle parameter
menuItemsRouter.param("menuItemId", (req, res, next, menuItemId) => {
  db.get(
    "SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId",
    { $menuItemId: menuItemId },
    (err, menuItem) => {
      // Error checking logic and assignment of menuItem to req if exists
      if (err) {
        next(err);
      } else if (menuItem) {
        req.menuItem = menuItem;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  );
});

// Update a menu item in a menu
menuItemsRouter.put("/:menuItemId", validateMenu, (req, res, next) => {
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description; // Not required
  const inventory = req.body.menuItem.inventory;
  const price = req.body.menuItem.price;
  const menuItemId = req.params.menuItemId;

  // Send 400 error if required body values missing or menu missing
  if (!name || !inventory || !price) {
    res.sendStatus(400);
  }

  // Update menu items
  db.run(
    "UPDATE MenuItem SET name = $name, description = $desc, inventory = $inventory, price = $price WHERE MenuItem.id = $menuItemId",
    {
      $name: name,
      $desc: description,
      $inventory: inventory,
      $price: price,
      $menuItemId: menuItemId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        // Get menu item and return as response
        db.get(
          "SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId",
          { $menuItemId: menuItemId },
          function(err, menuItem) {
            res.status(200).json({ menuItem });
          }
        );
      }
    }
  );
});

// Delete menu item
menuItemsRouter.delete("/:menuItemId", validateMenu, (req, res, next) => {
  const menuItemId = req.params.menuItemId;

  db.run(
    "DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId",
    { $menuItemId: menuItemId },
    err => {
      if (err) {
        next(err);
      }
      res.sendStatus(204);
    }
  );
});

module.exports = menuItemsRouter;
