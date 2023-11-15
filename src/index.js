const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

// create and config server
const server = express();
server.use(cors());
server.use(express.json());

// init express aplication
const serverPort = 4007;
server.listen(serverPort, () => {
  console.log(`Server listening at http://localhost:${serverPort}`);
});

// conexion with mysql DB
async function getConnection() {
  const connection = await mysql.createConnection({
    host: "Localhost",
    user: "root",
    // password: "Mybootcamp@23",
    password: process.env.PASS,
    database: "vans_db",
  });
  await connection.connect();
  console.log(
    `Conexión establecida con la base de datos (identificador=${connection.threadId})`
  );

  return connection;
}

//LIST ALL VANS FROM MY DB - GET
server.get("/vans", async (req, res) => {
  let query = "SELECT * FROM vans_details";
  const conn = await getConnection();
  try {
    const [results] = await conn.query(query);
    const numOfElements = results.length;
    conn.end();
    res.json({
      count: numOfElements,
      results: results,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Ha ocurrido un error:${error}`,
    });
  }
});

// INSERT A NEW VAN - POST
server.post("/vans", async (req, res) => {
  const newVan = req.body;
  const { marca, año_matriculacion, color, numero_plazas } = newVan;
  let selectQuery =
    "SELECT * FROM vans_details WHERE marca = ? AND año_matriculacion = ?;";
  let query =
    "INSERT INTO vans_details(marca, año_matriculacion, color, numero_plazas) VALUES (?, ?, ?, ?);";

  if (isNaN(parseInt(año_matriculacion && numero_plazas))) {
    //if the year written or seats are not a number tell me by message and do not insert the van
    res.json({
      success: false,
      error: "Año de matriculacion y numero de plazas deben ser un número",
    });
    return;
  }

  try {
    const conn = await getConnection();

    // Verify if the van already exists
    const [existingVan] = await conn.query(selectQuery, [
      marca,
      año_matriculacion,
      color,
    ]);

    if (existingVan.length > 0) {
      // If the van exists, send me a message
      res.json({
        success: false,
        message: `Esta furgoneta ya existe, su id es ${existingVan[0].id} `,
        results: existingVan,
      });
      return;
    }

    // Insert the new van if it does not exist yet
    const [results] = await conn.query(query, [
      marca,
      año_matriculacion,
      color,
      numero_plazas,
    ]);

    if (results.affectedRows === 0) {
      //the insertion failed
      res.json({
        success: false,
        message: "No se ha podido insertar tu van",
      });
      return;
    }
    conn.end();
    res.json({
      success: true,
      id: results.insertId,
      results: results,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Ha ocurrido un error:${error}`,
    });
  }
});

//UPDATE VANS INFO - PUT
//test my endpoint writing the idVan I want to update on the url -- http://localhost:4007/vans/16
server.put("/vans/:id", async (req, res) => {
  const dataVan = req.body; //object, get req.body values
  const { marca, año_matriculacion, color, numero_plazas } = dataVan;
  const idVan = req.params.id; //get id through url params

  let sql =
    "UPDATE vans_details SET marca = ? , año_matriculacion = ?, color =?, numero_plazas = ? WHERE id = ?;";

  if (isNaN(parseInt(año_matriculacion && numero_plazas))) {
    //if the year written or seats are not a number tell me by message and do not update the van
    res.json({
      success: false,
      error: "Año de matriculacion y numero de plazas deben ser un número",
    });
    return;
  }
  try {
    const conn = await getConnection();
    const [results] = await conn.query(sql, [
      marca,
      año_matriculacion,
      color,
      numero_plazas,
      idVan,
    ]);

    if (results.affectedRows === 0) {
      //the van chosen does not exist
      res.json({
        success: false,
        message: `Lo siento pero no existe la van ${idVan}`,
      });
      return;
    }
    if (results.affectedRows === 0) {
      //the updating failed
      res.json({
        success: false,
        message: "No se ha podido actualizar tu van",
      });
      return;
    }
    conn.end();
    res.json({
      success: true,
      message: `Van ${idVan} actualizada correctamente`,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Ha ocurrido un error${error}`,
    });
  }
});

// REMOVE A VAN FROM THE LIST - DELETE
server.delete("/vans/:id", async (req, res) => {
  const idVan = req.params.id; //get id through url params
  let sql = " DELETE FROM vans_details WHERE id = ?;";

  try {
    const conn = await getConnection();
    const [results] = await conn.query(sql, [idVan]);
    if (results.affectedRows === 0) {
      //the van chosen does not exist
      res.json({
        success: false,
        message: `Lo siento pero no existe la van ${idVan}`,
      });
      return;
    }
    conn.end();
    res.json({
      success: true,
      message: `La Van ${idVan} ha sido eliminada :(`,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Ha ocurrido un error${error}`,
    });
  }
});

//GET ONE VAN BY ID - (GET /vans/:id).
server.get("/vans/:id", async (req, res) => {
  const idVan = req.params.id; //get id through url params

  if (isNaN(parseInt(idVan))) {
    //if the ID written is not a number tell me by message
    res.json({
      success: false,
      error: "El id debe ser un número",
    });
    return;
  }

  let query = "SELECT * FROM vans_details WHERE id = ?";
  try {
    const conn = await getConnection();
    const [results] = await conn.query(query, [idVan]);
    const numOfElements = results.length;
    conn.end();
    if (numOfElements === 0) {
      //if the ID does not exists give me a message
      res.json({
        success: false,
        message: "No existe la van que buscas",
      });
      return;
    }
    res.json({
      results: results[0],
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Ha ocurrido un error:${error}`,
    });
  }
});
