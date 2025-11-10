# 🪙 DApp Lista de Espera (TokenEspera + Registro)

Aplicación descentralizada (DApp) que combina un **token ERC20** y un **contrato de lista de espera**.  
Permite a los usuarios **comprar tokens TESP** (TokenEspera) y **registrarse en una lista de espera** aprobando previamente el uso de esos tokens.  

---

## 🚀 Características principales

- Contrato **TokenEspera (TESP)** basado en `ERC20` (OpenZeppelin).
- Precio fijo de compra (por ejemplo 0.01 tBNB por token).
- Bonus automático de 1 token adicional por cada token ya poseído.
- Contrato **ListaEspera** donde los usuarios se registran si poseen suficientes tokens.
- Función de **retiro de fondos** por el owner del contrato.
- Interfaz web React + Bootstrap para interacción con MetaMask.

---

## 🧱 Arquitectura del proyecto

```
blockchain-waitinglist-dapp/
│
├── contracts/
│   ├── TokenEspera.sol          # Contrato ERC20 del token
│   ├── ListaEspera.sol          # Contrato de registro
│
├── src/
│   ├── components/              # Componentes React
│   ├── contracts/               # JSON de los contratos compilados
│   ├── App.js                   # Lógica principal de la DApp
│   └── index.js                 # Punto de entrada React
│
├── package.json
├── hardhat.config.js
└── README.md
```

---

## ⚙️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tuusuario/blockchain-waitinglist-dapp.git
cd blockchain-waitinglist-dapp
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Hardhat
Crea o edita el fichero `.env` con tus claves de red (por ejemplo testnet BSC):
```
PRIVATE_KEY=tu_clave_privada
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

## 💻 Ejecución del frontend

```bash
npm start
```

La aplicación se abrirá en [http://localhost:3000](http://localhost:3000)  
Asegúrate de tener **MetaMask** conectada a **BSC Testnet (Chain ID 97)**.

---

## 🔑 Flujo de uso

1. Comprar tokens TESP enviando tBNB.  
2. Aprobar el uso de 1 TESP por parte del contrato ListaEspera.  
3. Registrarse en la lista.  
4. El administrador puede consultar o retirar fondos acumulados.

---

## 🧪 Tecnologías utilizadas

- Solidity 0.8.x    
- React 18 + React Bootstrap  
- Ethers.js  
- MetaMask provider  
- BSC Testnet  

---

## 👨‍💻 Autor

Desarrollado por **JuanMa Sierra**  
Proyecto educativo dentro de *MU Blockchain Project*.
