const express = require("express");
const cors = require("cors");
const db = require("./db/db");

const app = express();

app.use(express.json());

app.use(cors());

const PORT = process.env.PORT || 8001;

app.use("/herramientas", require("./routes/herramientas.routes"));
app.use("/operaciones", require("./routes/operaciones.routes"));


app.listen(PORT, () => console.log("API escuchando en puerto +", PORT));