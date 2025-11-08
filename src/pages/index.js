import detectEthereumProvider from "@metamask/detect-provider";
import { decodeError } from "@ubiquity-os/ethers-decode-error";
import { Contract, ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import tokenManifest from "../contracts/TokenEspera.json";
import listaManifest from "../contracts/ListaEspera.json";
import {
  Container,
  Card,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";

export default function ListaEsperaDApp() {
  const tokenContract = useRef(null);
  const listaContract = useRef(null);

  const [account, setAccount] = useState("");
  const [saldo, setSaldo] = useState("0");
  const [posicion, setPosicion] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const tokenEsperaAddress = "0xfBA5f265790B815Dc23c2d8a3aC911B60A128ae6";
  const listaEsperaAddress = "0xfDd1f02258034fAb07Ff415a0D200fF0462E8901";

  useEffect(() => {
    const init = async () => {
      await configurarBlockchain();
    };
    init();
  }, []);

  const configurarBlockchain = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      alert("MetaMask not detected. Please install it to continue.");
      return;
    }

    await provider.request({ method: "eth_requestAccounts" });
    const accounts = await provider.request({ method: "eth_accounts" });
    setAccount(accounts[0]);

    const providerEthers = new ethers.providers.Web3Provider(provider);
    const signer = providerEthers.getSigner();

    tokenContract.current = new Contract(tokenEsperaAddress, tokenManifest.abi, signer);
    listaContract.current = new Contract(listaEsperaAddress, listaManifest.abi, signer);

    // Verifica si el usuario actual es el owner del contrato ListaEspera
    const owner = await listaContract.current.owner();
    setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());

    await actualizarSaldo();
  };

  // Actualiza saldo TokenEspera
  const actualizarSaldo = async () => {
    const balance = await tokenContract.current.balanceOf(account);
    setSaldo(ethers.utils.formatEther(balance));
  };

  // Comprar TokenEspera
  const comprarToken = async () => {
    setLoading(true);
    try {
      const tx = await tokenContract.current.buyToken({
        value: ethers.utils.parseEther("0.01"),
      });
      await tx.wait();
      await actualizarSaldo();
      setMensaje("✅ Token purchased successfully");
    } catch (err) {
      const decoded = decodeError(err);
      setMensaje(`❌ Error purchasing token: ${decoded.error}`);
    }
    setLoading(false);
  };

  // Registrarse (envía token y llama al contrato)
  const registrarse = async () => {
    setLoading(true);
    try {
      // Primero enviar el token directamente al contrato ListaEspera
      const tx1 = await tokenContract.current.transfer(
        listaEsperaAddress,
        ethers.utils.parseEther("1")
      );
      await tx1.wait();

      // Luego llamar a register() para anotarse
      const tx2 = await listaContract.current.register();
      await tx2.wait();

      await actualizarSaldo();
      setMensaje("✅ Registered successfully in the waiting list!");
    } catch (err) {
      const decoded = decodeError(err);
      setMensaje(`❌ ❌ Error registering: ${decoded.error}`);
    }
    setLoading(false);
  };

  // Consultar posición
  const consultarPosicion = async () => {
    try {
      const pos = await listaContract.current.myPosition();
      setPosicion(pos.toString());
      setMensaje(`📋 Your current position: ${pos}`);
    } catch {
      setMensaje("⚠️ Not registered or error fetching position");
    }
  };

  // Renunciar
  const renunciar = async () => {
    setLoading(true);
    try {
      const tx = await listaContract.current.resign();
      await tx.wait();
      await actualizarSaldo();
      setMensaje("✅ You resigned successfully (0.5 TESP refunded)");
    } catch (err) {
      const decoded = decodeError(err);
      setMensaje(`❌ Error resigning: ${decoded.error}`);
    }
    setLoading(false);
  };

  // 👑 Admin: Retirar primer usuario
  const retirarPrimero = async () => {
    setLoading(true);
    try {
      const tx = await listaContract.current.removeFirst();
      await tx.wait();
      setMensaje("✅ First user successfully removed from the list");
    } catch (err) {
      const decoded = decodeError(err);
      setMensaje(`❌ Error removing user: ${decoded.error}`);
    }
    setLoading(false);
  };

  // Admin: Retirar todos los fondos (tBNB de TokenEspera → wallet del owner)
  const recoverAllFunds = async () => {
    setLoading(true);
    try {
      const tx = await listaContract.current.recoverAllFunds();
      await tx.wait();
      setMensaje("✅ All funds successfully recovered to admin wallet");
    } catch (err) {
      const decoded = decodeError(err);
      setMensaje(`❌ Error recovering funds: ${decoded.error}`);
    }
    setLoading(false);
  };

  return (
    <Container className="mt-4" style={{ maxWidth: "700px" }}>
      <h1 className="text-center mb-4">Lista de Espera DApp</h1>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Account Information</Card.Title>
          {!account ? (
            <Alert variant="warning">Connect your wallet with MetaMask.</Alert>
          ) : (
            <Alert variant="info">
              <strong>Account:</strong> {account}
              <br />
              <strong>TokenEspera Balance:</strong> {saldo} TESP
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Token Management</Card.Title>
          <Row className="mt-2">
            <Col>
              <Button
                variant="primary"
                className="w-100"
                onClick={comprarToken}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : "💰 Buy 1 Token (0.01 tBNB)"}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Waiting List</Card.Title>
          <Row className="mb-2">
            <Col>
              <Button
                variant="success"
                className="w-100"
                onClick={registrarse}
                disabled={loading}
              >
                📝 Register (Send 1 TESP)
              </Button>
            </Col>
            <Col>
              <Button
                variant="info"
                className="w-100"
                onClick={consultarPosicion}
                disabled={loading}
              >
                🔍 Check Position
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <Button
                variant="warning"
                className="w-100"
                onClick={renunciar}
                disabled={loading}
              >
                🚪 Resign
              </Button>
            </Col>
            {isOwner && (
              <Col>
                <Button
                  variant="danger"
                  className="w-100"
                  onClick={retirarPrimero}
                  disabled={loading}
                >
                  👑 Remove First (Admin)
                </Button>
              </Col>
            )}
          </Row>
          {posicion && (
            <Alert variant="light" className="text-center mt-3">
              📋 Your current position: <strong>{posicion}</strong>
            </Alert>
          )}
        </Card.Body>
      </Card>
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Admin Panel</Card.Title>
          {isOwner ? (
            <>
              <Alert variant="success" className="text-center">
                You are the contract administrator.
              </Alert>

              <Button
                variant="outline-success"
                className="w-100 mt-2"
                onClick={recoverAllFunds}
                disabled={loading}
              >
                💰 Recover all tBNB (TokenEspera → Wallet)
              </Button>
            </>
          ) : (
            <Alert variant="warning" className="text-center">
              Only the contract owner can remove users or withdraw funds.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {mensaje && (
        <Alert variant="light" className="text-center mt-3">
          {mensaje}
        </Alert>
      )}

      <footer className="text-center mt-4 text-muted">
        <small>
          Developed by JuanMa Sierra — TokenEspera & ListaEspera DApp (BSC Testnet)
        </small>
      </footer>
    </Container>
  );
}
