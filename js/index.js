// ================== CONFIGURAÇÕES ==================
const MQTT_HOST = "192.168.x.x";   // IP do computador com Mosquitto
const MQTT_PORT = 9001;
const MQTT_TOPIC_TEMP = "aulas/professortupi/temperatura";
const MQTT_TOPIC_UMID = "aulas/professortupi/umidade";
const MQTT_TOPIC_GAS  = "aulas/professortupi/qualidade_ar";

// Senha do professor (salva no localStorage)
const SENHA_PROFESSOR = "senha_do_grupo";

if (!localStorage.getItem("senha_grupo")) {
  localStorage.setItem("senha_grupo", SENHA_PROFESSOR);
}
console.log("Senha salva no localStorage:", localStorage.getItem("senha_grupo"));

// ================== MQTT ==================
let client;

function atualizarStatus(conectado) {
  const el = document.getElementById("status-conexao");
  if (!el) return;
  
  if (conectado) {
    el.textContent = "Conectado";
    el.className = "status conectado";
  } else {
    el.textContent = "Desconectado";
    el.className = "status desconectado";
  }
}

function onConnect() {
  console.log("MQTT conectado");
  atualizarStatus(true);
  client.subscribe(MQTT_TOPIC_TEMP);
  client.subscribe(MQTT_TOPIC_UMID);
  client.subscribe(MQTT_TOPIC_GAS);
}

function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("Conexão perdida:", responseObject.errorMessage);
  }
  atualizarStatus(false);
  setTimeout(conectarMQTT, 3000);
}

function onMessageArrived(message) {
  const topic = message.destinationName;
  const valor = message.payloadString;

  if (topic === MQTT_TOPIC_TEMP) {
    document.getElementById("temp-valor").textContent = valor + " °C";
    document.getElementById("temp-alerta").classList.toggle("alerta", parseFloat(valor) > 28);
  } 
  else if (topic === MQTT_TOPIC_UMID) {
    document.getElementById("umid-valor").textContent = valor + " %";
    document.getElementById("umid-alerta").classList.toggle("alerta", parseFloat(valor) > 56);
  } 
  else if (topic === MQTT_TOPIC_GAS) {
    document.getElementById("gas-valor").textContent = valor;
    document.getElementById("gas-alerta").classList.toggle("alerta", parseInt(valor) > 400);
  }
}

function conectarMQTT() {
  const clientId = "web_" + Math.random().toString(16).substr(2, 8);
  client = new Paho.MQTT.Client(MQTT_HOST, MQTT_PORT, clientId);

  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  client.connect({
    onSuccess: onConnect,
    onFailure: (err) => {
      console.error("Falha na conexão MQTT:", err);
      atualizarStatus(false);
      setTimeout(conectarMQTT, 5000);
    },
    useSSL: false,
    timeout: 5
  });
}

// Só conecta se estiver na página do dashboard
if (document.getElementById("temp-valor")) {
  conectarMQTT();
}
