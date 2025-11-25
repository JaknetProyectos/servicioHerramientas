const { Router } = require("express");
const router = Router();
const controller = require("../controllers/operaciones");

router.get("/", controller.getOperaciones);

module.exports = router;