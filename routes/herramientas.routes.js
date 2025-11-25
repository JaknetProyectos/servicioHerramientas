const { Router } = require("express");
const router = Router();
const controller = require("../controllers/herramientas");

router.get("/", controller.getHerramientas);

module.exports = router;