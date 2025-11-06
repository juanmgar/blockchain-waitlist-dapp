import detectEthereumProvider from "@metamask/detect-provider";
import { decodeError } from "@ubiquity-os/ethers-decode-error";
import { Contract, ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import auctionManifest from "../contracts/Auction.json";
import {
  Container
} from "react-bootstrap";

export default function Home() {
  // Referencia al contrato desplegado
  const auctionContract = useRef(null);

  // Se ejecuta al cargar el componente
  useEffect(() => {
    let init = async () => {
      await configurarBlochain();
    };
    init();
  }, []);

  // Configura la conexión con Metamask y el contrato
  const configurarBlochain = async () => {
    const provider = await detectEthereumProvider();
    if (provider) {
      console.log("Ethereum provider detected:", provider);
      await provider.request({ method: "eth_requestAccounts" });
      const networkId = await provider.request({ method: "net_version" });
      console.log("Connected to network ID:", networkId);

      const accounts = await provider.request({ method: "eth_accounts" });
      setAccount(accounts[0]);

      // Crea una instancia de ethers.js con el signer actual
      let providerEthers = new ethers.providers.Web3Provider(provider);
      let signer = providerEthers.getSigner();
      const auctionContractAddress = "0x4f96c16c3aa1e0ab476cf8cacbf5d639cb6aa4d3";
      auctionContract.current = new Contract(auctionContractAddress, auctionManifest.abi, signer);
      console.log("Connected to contract:", auctionContract.current);
    } else {
      console.log("No Ethereum provider detected");
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: "700px" }}>
      <h1>Blockchain Auction DApp</h1>
    </Container>
  );
}
