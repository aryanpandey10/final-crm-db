const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/api/dashboard-data", async (req, res) => {
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GetDashboardData xmlns="http://tempuri.org/" />
  </soap12:Body>
</soap12:Envelope>`;

  try {
    const response = await axios.post(
      "http://172.16.0.247/OrbisCRMWS/OldCRMService.asmx",
      soapEnvelope,
      {
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
      }
    );

    xml2js.parseString(response.data, (err, result) => {
      if (err) {
        console.error("Error parsing XML:", err);
        res.status(500).send("Error parsing XML");
      } else {
        // Extract data from the parsed XML
        const data =
          result["soap:Envelope"]["soap:Body"][0][
            "GetDashboardDataResponse"
          ][0]["GetDashboardDataResult"][0]["diffgr:diffgram"][0][
            "NewDataSet"
          ][0]["Table"];

        // Process data for ranking and agent data
        const agentData = [];
        const rankingData = [];

        data.forEach((agent) => {
          const name = agent.Agent[0];
          const totalBookings = parseInt(agent.TOTAL[0], 10);
          const profit = parseFloat(agent.PROFIT[0]);

          // Add to agent data
          agentData.push({
            name,
            photo: "https://via.placeholder.com/50", // Default photo, replace with actual if available
            bookings: totalBookings,
            profit: profit,
          });

          // Add to ranking data
          rankingData.push({
            name,
            photo: "https://via.placeholder.com/50", // Default photo, replace with actual if available
            bookings: totalBookings,
            profit: profit,
          });
        });

        // Sort ranking data by profit descending
        rankingData.sort((a, b) => b.profit - a.profit);

        res.json({ agentData, rankingData });
      }
    });
  } catch (error) {
    console.error("Error making SOAP request:", error);
    res.status(500).send("Error making SOAP request");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
