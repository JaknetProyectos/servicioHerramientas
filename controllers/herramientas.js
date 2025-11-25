const db = require("../db/db");

const getHerramientas = async (req, res) => {
    try {
        const snapshot = await db.collection("tools_herramientas").get();

        if (snapshot.empty) {
            return res.json([]);
        }

        const herramientas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(herramientas);

    } catch (error) {
        console.error("Error obteniendo herramientas:", error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getHerramientas
};