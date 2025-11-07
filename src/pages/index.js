import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { Container, Button, Card, Form, Alert, Row, Col } from "react-bootstrap";
import { decodeError } from "@ubiquity-os/ethers-decode-error";
import tokenManifest from "./contracts/TokenEspera.json";
import listaManifest from "./contracts/ListaEspera.json";

export default function ListaEsperaDApp() {
  const tokenContract = useRef(null);
  const listaContract = useRef(null);

  const [account, setAccount] = useState("");
  const [saldo, setSaldo] = useState(0);
  const [posicion, setPosicion] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const tokenAddress = "0x1234567890123456789012345678901234567890";
  const listaAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

  useEffect(() => {
    const init = async () => {
      await configurarBlockchain();
    };
    init();
  }, []);

  const configurarBlockchain = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      alert("MetaMask no detectado. Instálalo para continuar.");
      return;
    }

    await provider.request({ method: "eth_requestAccounts" });
    const accounts = await provider.request({ method: "eth_accounts" });
    setAccount(accounts[0]);

    const providerEthers = new ethers.providers.Web3Provider(provider);
    const signer = providerEthers.getSigner();

    tokenContract.current = new Contract(tokenAddress, tokenManifest.abi, signer);
    listaContract.current = new Contract(listaAddress, listaManifest.abi, signer);

    console.log("Conectado a contratos:", tokenContract.current, listaContract.current);

    const owner = await listaContract.current.owner();
    setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());

    await actualizarSaldo();
  };

  const actualizarSaldo = async () => {
    const balance = await tokenContract.current.balanceOf(account);
    setSaldo(ethers.utils.formatEther(balance));
  };

  const comprarToken = async () => {
    try {
      const tx = await tokenContract.current.comprarToken({
        value: ethers.utils.parseEther("0.01"), // 0.01 tBNB por token
      });
      await tx.wait();
      setMensaje("✅ Token comprado correctamente");
      await actualizarSaldo();
    } catch (err) {
      setMensaje("❌ Error al comprar token: " + decodeError(err));
    }
  };

  const aprobarTokens = async () => {
    try {
      const tx = await tokenContract.current.approve(listaAddress, ethers.utils.parseEther("1"));
      await tx.wait();
      setMensaje("✅ Aprobación de 1 TokenEspera realizada");
    } catch (err) {
      setMensaje("❌ Error al aprobar: " + decodeError(err));
    }
  };

  const registrarse = async () => {
    try {
      const tx = await listaContract.current.registrarse();
      await tx.wait();
      setMensaje("✅ Registrado en la lista");
    } catch (err) {
      setMensaje("❌ Error al registrarse: " + decodeError(err));
    }
  };

  const consultarPosicion = async () => {
    try {
      const pos = await listaContract.current.miPosicion();
      setPosicion(pos.toString());
      setMensaje(`📋 Tu posición actual: ${pos}`);
    } catch (err) {
      setMensaje("⚠️ No estás inscrito o error al consultar posición");
    }
  };

  const renunciar = async () => {
    try {
      const tx = await listaContract.current.renunciar();
      await tx.wait();
      setMensaje("✅ Has renunciado (se reembolsa 0.5 TESP)");
      await actualizarSaldo();
    } catch (err) {
      setMensaje("❌ Error al renunciar: " + decodeError(err));
    }
  };

  const retirarPrimero = async () => {
    try {
      const tx = await listaContract.current.retirarPrimero();
      await tx.wait();
      setMensaje("✅ Primer usuario retirado de la lista");
    } catch (err) {
      setMensaje("❌ Error al retirar usuario: " + decodeError(err));
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: "720px" }}>
      <h2 className="mb-4 text-center">🪙 Lista de Espera Descentralizada</h2>

      {account && (
        <Alert variant="info">
          <b>Cuenta:</b> {account}
          <br />
          <b>Saldo TokenEspera:</b> {saldo} TESP
        </Alert>
      )}

      <Card className="p-3 shadow-sm mb-4">
        <h5>Compra y gestión de tokens</h5>
        <Button className="mt-2 me-2" onClick={comprarToken}>
          💰 Comprar Token (0.01 tBNB)
        </Button>
        <Button className="mt-2" variant="secondary" onClick={aprobarTokens}>
          ✅ Aprobar uso de 1 TESP
        </Button>
      </Card>

      <Card className="p-3 shadow-sm mb-4">
        <h5>Registro en la lista</h5>
        <Row>
          <Col>
            <Button className="mt-2 w-100" onClick={registrarse}>
              📝 Registrarse
            </Button>
          </Col>
          <Col>
            <Button className="mt-2 w-100" variant="info" onClick={consultarPosicion}>
              🔍 Consultar posición
            </Button>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <Button className="mt-2 w-100" variant="warning" onClick={renunciar}>
              🚪 Renunciar
            </Button>
          </Col>
          {isOwner && (
            <Col>
              <Button className="mt-2 w-100" variant="danger" onClick={retirarPrimero}>
                👑 Retirar primero (Admin)
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {mensaje && <Alert variant="light" className="text-center">{mensaje}</Alert>}

      <footer className="text-center mt-4 text-muted">
        <small>Desarrollado por JuanMa Sierra – Proyecto Lista de Espera (BSC Testnet)</small>
      </footer>
    </Container>
  );
}
