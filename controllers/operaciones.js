const db = require("../db/db");
const admin = require("firebase-admin");

const getOperaciones = async (req, res) => {
    try {
        let {
            devuelto,
            fecha_inicial,
            fecha_final,
            usuario_id,
            herramienta_id,
        } = req.query;

        let query = db.collection("OperacionesHerramientas");

        // 1️⃣ Filtro: devuelto
        if (devuelto !== undefined) {
            const boolValue = devuelto === "true" || devuelto === true;
            query = query.where("devuelto", "==", boolValue);
        }

        // 2️⃣ Filtro: usuario_id
        if (usuario_id) {
            const refUsuario = db.collection("usuarios").doc(usuario_id);
            query = query.where("usuario", "==", refUsuario);
        }

        // 3️⃣ Filtro: herramienta_id
        if (herramienta_id) {
            const refHerramienta = db.collection("tools_herramientas").doc(herramienta_id);
            query = query.where("herramienta", "==", refHerramienta);
        }

        // 4️⃣ Filtro: fecha_inicial y fecha_final (en campo fecha)
        if (fecha_inicial) {
            query = query.where("fecha", ">=", new Date(fecha_inicial));
        }

        if (fecha_final) {
            query = query.where("fecha", "<=", new Date(fecha_final));
        }

        // 5️⃣ Ejecutar query
        const opsSnapshot = await query.get();

        if (opsSnapshot.empty) {
            return res.json([]);
        }

        // 6️⃣ Transformar operaciones
        const operaciones = opsSnapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                fecha: data.fecha,
                fecha_devolucion: data.fecha_devolucion || null,
                cantidad: data.cantidad,
                usuario_ref: data.usuario instanceof admin.firestore.DocumentReference ? data.usuario : null,
                herramienta_ref: data.herramienta instanceof admin.firestore.DocumentReference ? data.herramienta : null
            };
        });

        // 7️⃣ Extraer IDs únicos de usuarios y herramientas
        const usuarioIds = new Set();
        const herramientaIds = new Set();

        operaciones.forEach(op => {
            if (op.usuario_ref?.id) usuarioIds.add(op.usuario_ref.id);
            if (op.herramienta_ref?.id) herramientaIds.add(op.herramienta_ref.id);
        });

        // 8️⃣ Batch get usuarios
        let usuariosMap = {};
        if (usuarioIds.size > 0) {
            const snapshots = await db.getAll(
                ...Array.from(usuarioIds).map(id => db.collection("usuarios").doc(id))
            );
            snapshots.forEach(doc => {
                if (doc.exists) usuariosMap[doc.id] = doc.data();
            });
        }

        // 9️⃣ Batch get herramientas
        let herramientasMap = {};
        if (herramientaIds.size > 0) {
            const snapshots = await db.getAll(
                ...Array.from(herramientaIds).map(id => db.collection("tools_herramientas").doc(id))
            );
            snapshots.forEach(doc => {
                if (doc.exists) herramientasMap[doc.id] = doc.data();
            });
        }

        // 🔟 Construir resultado final
        const resultado = operaciones.map(op => {
            const usuario = usuariosMap[op.usuario_ref?.id] || null;
            const herramienta = herramientasMap[op.herramienta_ref?.id] || null;

            const toIso = (v) => {
                if (!v) return null;
                try {
                if (typeof v.toDate === "function") return v.toDate().toISOString();
                if (v instanceof Date) return v.toISOString();
                if (typeof v === "string") return v; // ya viene en ISO
                if (typeof v === "object" && (v._seconds || v.seconds)) {
                    const secs = v._seconds ?? v.seconds;
                    return new Date(secs * 1000).toISOString();
                }
                return null;
                } catch (_) { return null; }
            };

            return {
                id: op.id,
                usuario_id: op.usuario_ref?.id || null,
                usuario_nombre: usuario?.nombre || usuario?.username || null,

                herramienta_id: op.herramienta_ref?.id || null,
                herramienta_nombre: herramienta?.nombre || null,

                fecha: toIso(op.fecha),
                fecha_devolucion: toIso(op.fecha_devolucion),
                cantidad: op.cantidad
            };
        });

        return res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getOperaciones
};