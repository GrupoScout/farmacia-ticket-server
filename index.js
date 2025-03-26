const express = require("express");
const https = require("https");

const app = express();
app.use(express.json());

const ACCESS_TOKEN = "TEST-6409830259868805-032508-9bfdacac4ea8fd44e23b80c6f9adb806-210651516";
let ultimoPago = null;

app.post("/webhook", (req, res) => {
  const data = req.body;

  if (data.type === "payment") {
    const paymentId = data.data.id;

    // Consultamos a Mercado Pago con el ID real
    const options = {
      hostname: "api.mercadopago.com",
      path: `/v1/payments/${paymentId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    };

    const mpRequest = https.request(options, (mpResponse) => {
      let body = "";

      mpResponse.on("data", (chunk) => {
        body += chunk;
      });

      mpResponse.on("end", () => {
        const pago = JSON.parse(body);

        if (pago.status === "approved") {
          ultimoPago = {
            id: pago.id,
            monto: pago.transaction_amount,
            fecha: new Date(pago.date_approved).toLocaleDateString("es-AR"),
            hora: new Date(pago.date_approved).toLocaleTimeString("es-AR"),
            cliente: pago.payer?.first_name || "Cliente",
            codigo: pago.id.toString().slice(-16)
          };

          console.log("✅ Pago aprobado:", ultimoPago);
        } else {
          console.log("⚠️ Pago recibido pero no aprobado:", pago.status);
        }
      });
    });

    mpRequest.on("error", (err) => {
      console.error("Error al consultar pago:", err);
    });

    mpRequest.end();
  }

  res.sendStatus(200);
});

app.get("/ultimo-pago", (req, res) => {
  res.json(ultimoPago || {});
});

app.listen(3000, () => {
  console.log("Servidor escuchando en puerto 3000");
});
