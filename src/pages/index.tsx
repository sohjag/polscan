import Image from "next/image";
import { Inter } from "next/font/google";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { useEffect, useState } from "react";
import { hexToU8a, isHex } from "@polkadot/util";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";

async function isValidAddressPolkadotAddress(addr: any) {
  try {
    console.log("checking addr validity");
    encodeAddress(isHex(addr) ? hexToU8a(addr) : decodeAddress(addr));

    return true;
  } catch (error) {
    return false;
  }
}

export default function Home() {
  let wsProvider;
  let api: any;
  const [genesisHash, setGenesisHash] = useState("");
  const [amountReq, setAmountReq] = useState();
  const [address, setAddress] = useState("");
  const [nonceSt, setNonceSt] = useState();
  const [balanceSt, setBalanceSt] = useState<any>();
  const [balFrozen, setBalFrozen] = useState<any>();
  const [balReserved, setBalReserved] = useState<any>();
  const [timestamp, setTimestamp] = useState();
  const [blockNum, setBlockNum] = useState();

  useEffect(() => {
    async function GetProviderApi() {
      try {
        wsProvider = new WsProvider("wss://rpc.polkadot.io");
        api = await ApiPromise.create({ provider: wsProvider });

        console.log("api...", api);
        setGenesisHash(api._genesisHash.toHex());
        setAmountReq(api.consts.balances.existentialDeposit.toNumber());
        console.log(genesisHash);

        const { number } = await api.rpc.chain.getHeader();
        setBlockNum(number.toNumber());
      } catch (e) {
        console.log(e);
      }
    }
    GetProviderApi();
  }, []);

  const handleGetData = async () => {
    try {
      console.log("handling get data");

      if (!isValidAddressPolkadotAddress(address)) {
        alert("Please enter a valid address");
        return;
      }
      console.log("address..", address);
      if (!api) {
        wsProvider = new WsProvider("wss://rpc.polkadot.io");
        api = await ApiPromise.create({ provider: wsProvider });
      }

      console.log("api...", api);
      if (address && api) {
        const { nonce, data: balance } = await api.query.system.account(
          address
        );
        const now = await api.query.timestamp.now();
        console.log("now..", now);
        setTimestamp(now);
        console.log("nonce...", nonce);
        console.log("balance...", balance);
        console.log("typeof nonce...", typeof nonce);
        console.log("typeof balance...", typeof balance);
        console.log(
          `${now}: balance of ${balance.free} and a nonce of ${nonce}`
        );

        console.log("nonce...", nonce.toNumber());
        console.log("balance...", balance.free.toNumber());

        let balanceNumber = balance.free.toNumber();
        let balanceWithDecimal = balanceNumber / 1e10;
        console.log("balanceWithDecimal...", balanceWithDecimal);

        let frozen = balance.frozen.toNumber();
        let frozenWithDecimal = frozen / 1e10;

        let reserved = balance.reserved.toNumber();
        let reservedWithDecimal = reserved / 1e10;

        setBalanceSt(balanceWithDecimal);
        setBalFrozen(frozenWithDecimal);
        setBalReserved(reservedWithDecimal);
        setNonceSt(nonce.toNumber());
      }
    } catch (e) {
      console.log(e);
      alert("Please check address again.");
    }
  };

  setInterval(async () => {
    try {
      if (!api) {
        wsProvider = new WsProvider("wss://rpc.polkadot.io");
        api = await ApiPromise.create({ provider: wsProvider });
        const { number } = await api.rpc.chain.getHeader();
        if (number) {
          setBlockNum(number.toNumber());
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, 10000);
  useEffect(() => {}, [balanceSt]);

  return (
    <main>
      <div className="flex justify-between bg-purple-900 text-white">
        <div>
          <h1 className="text-3xl font-bold m-2">Polscan</h1>
        </div>
        <div className="p-2 m-2 font-bold">
          <span className="text-3xl text-green-700">.</span>
          {blockNum}
        </div>
      </div>

      <div className="flex justify-center m-3">
        <div className="w-1/2 m-2">
          <input
            className="border border-stone-950 w-full p-2 focus:border-gray-700"
            onChange={(e) => {
              setAddress(e.target.value);
            }}
            placeholder="Enter a polkadot address"
          />
        </div>

        <div className="m-2">
          <button
            className="bg-black hover:bg-slate-800 text-white p-2"
            onClick={handleGetData}
          >
            Get Data
          </button>
        </div>
      </div>

      {address && <div className=" m-6 border-t-2 border-gray-300"></div>}

      {address && (
        <div className="m-3 p-3">
          <div className="font-bold text-lg">Address Info</div>

          <span className="font-bold">Free Balance: </span>
          <span>{balanceSt} DOT</span>
          <br />
          <span className="font-bold">Frozen Balance: </span>
          <span>{balFrozen} DOT</span>
          <br />
          <span className="font-bold">Reserved Balance: </span>
          <span>{balReserved} DOT</span>
          <br />
          <span className="font-bold">Nonce: </span>
          <span>{nonceSt}</span>
          <br />
          {/* Timestamp: <span>{timestamp}</span> */}
        </div>
      )}

      <div className=" m-6 border-t-2 border-gray-300"></div>

      <div className="m-3 mt-5 p-3">
        <div className="font-bold text-lg">Polkadot Blockchain Info</div>
        <span className="font-bold">Genesis hash: </span>
        <span>{genesisHash}</span>
        <br />
        <span className="font-bold">
          The amount required to create a new account:{" "}
        </span>
        {amountReq && <span>{amountReq / 1e10} DOT</span>}
      </div>
    </main>
  );
}
