// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenEspera.sol";

contract ListaEspera {
    TokenEspera public token;
    address public admin;
    uint256 public primero = 1;
    uint256 public ultimo = 0;

    mapping(uint256 => address) public cola;
    mapping(address => uint256) public posicion;
    mapping(address => bool) public registrado;

    event Registrado(address usuario, uint256 pos);
    event Eliminado(address usuario);
    event Renunciado(address usuario, uint256 reembolso);

    constructor(address tokenAddress) {
        token = TokenEspera(tokenAddress);
        admin = msg.sender;
    }

    // Registrarse (requiere approve de 1 TESP)
    function registrar() external {
        require(!registrado[msg.sender], "Ya registrado");
        require(token.balanceOf(msg.sender) >= 1e18, "Faltan tokens");

        token.transferFrom(msg.sender, address(this), 1e18);
        ultimo++;
        cola[ultimo] = msg.sender;
        posicion[msg.sender] = ultimo;
        registrado[msg.sender] = true;

        emit Registrado(msg.sender, ultimo);
    }

    // Admin elimina al primero y le devuelve su token
    function eliminarPrimero() external {
        require(msg.sender == admin, "Solo admin");
        require(ultimo >= primero, "Lista vacia");

        // Saltar huecos vacíos hasta encontrar un usuario válido
        while (primero <= ultimo && cola[primero] == address(0)) {
            primero++;
        }

        // Si la lista sigue vacía después de saltar huecos
        require(primero <= ultimo, "Lista vacia");

        address usuario = cola[primero];
        require(usuario != address(0), "Slot vacio");

        // Devuelve su token
        token.transfer(usuario, 1e18);

        // Limpieza de estado
        delete cola[primero];
        delete posicion[usuario];
        registrado[usuario] = false;

        primero++;

        // Si se ha vaciado completamente, resetea punteros
        if (primero > ultimo) {
            primero = 1;
            ultimo = 0;
        }

        emit Eliminado(usuario);
    }

    // Renuncia voluntaria (recibe 0.5 TESP)
    function renunciar() external {
        require(registrado[msg.sender], "No registrado");
        uint256 idx = posicion[msg.sender];
        require(idx != 0, "Indice invalido");

        // Devuelve la mitad (penalizacion)
        token.transfer(msg.sender, 0.5e18);

        // Limpieza de estado
        delete cola[idx];
        delete posicion[msg.sender];
        registrado[msg.sender] = false;

        // Si la lista queda vacía, reinicia punteros
        if (primero > ultimo) {
            primero = 1;
            ultimo = 0;
        }

        emit Renunciado(msg.sender, 0.5e18);
    }

    // Consultar posicion real
    function miPosicion() external view returns (uint256 posReal) {
        require(registrado[msg.sender], "No registrado");
        uint256 hasta = posicion[msg.sender];
        for (uint256 i = primero; i <= hasta; i++) {
            if (cola[i] != address(0)) posReal++;
        }
    }

    function totalUsuarios() external view returns (uint256 total) {
        for (uint256 i = primero; i <= ultimo; i++) {
            if (cola[i] != address(0)) total++;
        }
    }
}
