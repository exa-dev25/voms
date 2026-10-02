const mqtt = require("mqtt");
const telemetryService = require("../services/telemetry.service");

const TOPIC_MESSAGE_TYPES = {
  "vehicle/heartbeat": "HEARTBEAT",
  "vehicle/ignition": "IGNITION_START",
  "vehicle/alert": "ALERT",
  "vehicle/rfid": "RFID_EVENT",
};

function initMQTT() {
  if (!process.env.MQTT_BROKER_URL) {
    console.warn("MQTT_BROKER_URL not configured — MQTT client disabled.");
    return;
  }

  const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

  mqttClient.on("connect", () => {
    console.log("✅ Connected to MQTT Broker");
    const topics = (process.env.MQTT_TOPICS || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (topics.length) {
      mqttClient.subscribe(topics);
    }
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      await telemetryService.ingestTelemetry(data, TOPIC_MESSAGE_TYPES[topic]);
    } catch (err) {
      console.error("MQTT error:", err);
    }
  });
}

module.exports = initMQTT;
