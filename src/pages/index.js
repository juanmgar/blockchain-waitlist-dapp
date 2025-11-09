import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { decodeError } from "@ubiquity-os/ethers-decode-error";
import tokenManifest from "../contracts/TokenEspera.json";
import listManifest from "../contracts/ListaEspera.json";
import { Container, Card, Button, Row, Col } from "react-bootstrap";

export default function WaitlistDApp() {
  // Referencia a los contratos desplegados
  const tokenContract = useRef(null);
  const listContract = useRef(null);

  // Variables de estado de la aplicación
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [position, setPosition] = useState(null);

  // Direcciones desplegadas
  const tokenEsperaAddress = "0xD697AF7b8F070ed4a9291f3fcAB2f20ffBFDe81d";
  const listaEsperaAddress = "0xf3e7A6DEcF55DF3f0A1A083109D638f80FBbF578";

  useEffect(() => {
    let init = async () => {
      await configurarBlockchain();
      await updateBalance();
      await updateQueueInfo();
      const interval = setInterval(updateQueueInfo, 6000);
      return () => clearInterval(interval);
    };
    init();
  }, [account]);

  // Configura la conexión con Metamask y el contrato
  const configurarBlockchain = async () => {
    const provider = await detectEthereumProvider();
    if (provider) {
      console.log("Ethereum provider detected:", provider);
      await provider.request({ method: "eth_requestAccounts" });
      const networkId = await provider.request({ method: "net_version" });
      console.log("Connected to network ID:", networkId);

      const accounts = await provider.request({ method: "eth_accounts" });
      setAccount(accounts[0]);

      let providerEthers = new ethers.providers.Web3Provider(provider);
      let signer = providerEthers.getSigner();

      tokenContract.current = new Contract(tokenEsperaAddress, tokenManifest.abi, signer);
      listContract.current = new Contract(listaEsperaAddress, listManifest.abi, signer);
      console.log("Connected to tokenContract:", tokenContract.current);
      console.log("Connected to listContract:", listContract.current);

      await checkAdmin(accounts[0]);
    } else {
      console.log("No Ethereum provider detected");
    }
  };

  // Verifica si la cuenta conectada es admin
  const checkAdmin = async (acct) => {
    const admin = await listContract.current.admin();
    setIsAdmin(admin.toLowerCase() === acct.toLowerCase());
  };

  //Actualiza el balance del usuario
  const updateBalance = async () => {
    const balance = await tokenContract.current.balanceOf(account);
    setBalance(ethers.utils.formatEther(balance));
  };

  const updateQueueInfo = async () => {
    try {
      const total = await listContract.current.totalUsuarios();
      setTotalUsers(total.toNumber());

      try {
        const pos = await listContract.current.miPosicion();
        setPosition(pos.toNumber());
      } catch {
        setPosition(null); // not registered
      }
    } catch (err) {
      console.warn("Error updating queue info:", err.message);
    }
  };

  // Comprar TokenEspera
  const buyToken = async () => {
    try {
      const tx = await tokenContract.current.comprarToken({
        value: ethers.utils.parseEther("0.01"),
      });
      await tx.wait();
      await updateBalance();
      alert("✅ Token purchased successfully");
    } catch (err) {
      const decoded = decodeError(err);
      const msg = decoded?.error || err.reason || err.message;
      alert(`❌ Error buying token: ${msg}`);
    }
  };

  // Registrarse
  const register = async () => {
    try {
      const approve = await tokenContract.current.approve(
        listaEsperaAddress,
        ethers.utils.parseEther("1")
      );
      await approve.wait();

      const tx = await listContract.current.registrar();
      await tx.wait();
      await updateBalance();
      await updateQueueInfo();
      alert("✅ Successfully registered in the waiting list");
    } catch (err) {
      const decoded = decodeError(err);
      const msg = decoded?.error || err.reason || err.message;
      alert(`❌ Error registering: ${msg}`);
    }
  };

  // Withdraw from waiting list
  const resign = async () => {
    try {
      const tx = await listContract.current.renunciar();
      await tx.wait();
      await updateBalance();
      await updateQueueInfo();
      alert("✅ You have resigned successfully (received 0.5 TESP)");
    } catch (err) {
      const decoded = decodeError(err);
      const msg = decoded?.error || err.reason || err.message;
      alert(`❌ Error resigning: ${msg}`);
    }
  };

  // Admin: remove first user
  const removeFirst = async () => {
    try {
      const tx = await listContract.current.eliminarPrimero();
      await tx.wait();
      await updateQueueInfo();
      alert("✅ First user removed successfully");
    } catch (err) {
      const decoded = decodeError(err);
      const msg = decoded?.error || err.reason || err.message;
      alert(`❌ Error removing user: ${msg}`);
    }
  };

  // View position in the list
  const viewPosition = async () => {
    try {
      const pos = await listContract.current.miPosicion();
      setPosition(pos.toString());
      alert(`📋 Your current position: ${pos.toString()}`);
    } catch (err) {
      const decoded = decodeError(err);
      const msg = decoded?.error || err.reason || err.message;
      alert(`⚠️ Not registered or error fetching position: ${msg}`);
    }
  };

  // Withdraw funds from TokenEspera (owner only)
  const withdrawContractFunds = async () => {
    try {
      const owner = await tokenContract.current.owner();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        alert("Only the owner can withdraw funds");
        return;
      }
      const tx = await tokenContract.current.retirarFondos();
      await tx.wait();
      alert("✅Funds withdrawn successfully from the contract");
    } catch (err) {
      const decoded = decodeError(err);
      const msg = decoded?.error || err.reason || err.message;
      alert(`❌ Error withdrawing funds: ${msg}`);
    }
  };

  // View the BNB balance of the TokenEspera contract directly
  const viewContractFunds = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balanceWei = await provider.getBalance(tokenEsperaAddress);
      const balanceBNB = ethers.utils.formatEther(balanceWei);
      alert(`The TokenEspera contract holds ${balanceBNB} tBNB`);
    } catch (err) {
      alert(`Error reading contract balance: ${err.message}`);
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: "700px" }}>
      <h1 className="text-center mb-4">Waiting List DApp</h1>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Account</Card.Title>
          {account ? (
            <>
              <p><strong>Address:</strong> {account}</p>
              <p><strong>Balance:</strong> {balance} TESP</p>
              <p><strong>My Position:</strong> {position !== null ? position : "Not registered"}</p>
              <p><strong>Total Users:</strong> {totalUsers}</p>
            </>
          ) : (
            <p>Connect your wallet using MetaMask.</p>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>TokenEspera</Card.Title>
          <Row className="mb-2">
            <Col>
              <Button className="w-100" onClick={buyToken}>
                💰 Buy 1 Token (0.01 tBNB)
              </Button>
            </Col>
          </Row>
          <Row className="mb-2">
            <Col>
              <Button className="w-100" variant="info" onClick={viewContractFunds}>
                🏦 View Contract Funds
              </Button>
            </Col>
          </Row>
          {isAdmin && (
            <Row>
              <Col>
                <Button className="w-100" variant="danger" onClick={withdrawContractFunds}>
                  💸 Withdraw Funds (Admin Only)
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Waiting List</Card.Title>
          <Row className="mb-2">
            <Col>
              <Button className="w-100" variant="success" onClick={register}>
                📝 Register (Send 1 TESP)
              </Button>
            </Col>
            <Col>
              <Button className="w-100" variant="info" onClick={viewPosition}>
                🔍 View Position
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <Button className="w-100" variant="warning" onClick={resign}>
                🚪Resign
              </Button>
            </Col>
            {isAdmin && (
              <Col>
                <Button className="w-100" variant="danger" onClick={removeFirst}>
                  👑 Remove First
                </Button>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
