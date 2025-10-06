import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  ExtensionType,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import { useState, useRef } from "react";

export function TokenLaunchpad() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [mint, setMint] = useState(null);
  const ataRef = useRef(null);

  const nameRef = useRef("");
  const symbolRef = useRef("");
  const supplyRef = useRef("");

  async function createToken() {
    const mintKeypair = await Keypair.generate();
    const metadata = {
      mint: mintKeypair.publicKey,
      name: nameRef.current.value,
      symbol: symbolRef.current.value,
      uri: "https://cdn.100xdevs.com/metadata.json",
      additionalMetadata: [],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        wallet.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintKeypair.publicKey,
        metadata: mintKeypair.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      })
    );

    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.partialSign(mintKeypair);

    await wallet.sendTransaction(transaction, connection);
    setMint(mintKeypair.publicKey);
    alert(`Token created! Mint address: ${mintKeypair.publicKey}`);
  }

  async function createAta() {
    if (!mint) return;
    const ata = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const ataExist = await connection.getAccountInfo(ata);
    if (!ataExist) {
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          ata,
          wallet.publicKey,
          mint,
          TOKEN_2022_PROGRAM_ID
        )
      );
      await wallet.sendTransaction(transaction, connection);
      ataRef.current = ata;
      alert(`Associated Token Account created: ${ataRef.current}`);
    } else {
      alert("Account already exists on the chain.");
    }
  }

  async function mintTokens() {
    if (!ataRef.current) return;

    try {
      const transaction = new Transaction().add(
        createMintToInstruction(
          mint,
          ataRef.current,
          wallet.publicKey,
          supplyRef.current.value * LAMPORTS_PER_SOL,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      await wallet.sendTransaction(transaction, connection);
      alert(`Minted ${supplyRef.current.value} tokens to ${ataRef.current}`);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-900 via-black to-gray-900 text-white px-4">
      <div className="bg-gray-800/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-400">
          Solana Token Launchpad
        </h1>

        <div className="flex flex-col space-y-4">
          <input
            ref={nameRef}
            type="text"
            placeholder="Token Name"
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            ref={symbolRef}
            type="text"
            placeholder="Symbol"
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Image URL"
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            ref={supplyRef}
            type="text"
            placeholder="Initial Supply"
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={createToken}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-semibold transition duration-200"
            >
              Create Token
            </button>
            <button
              onClick={createAta}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold transition duration-200"
            >
              Create ATA
            </button>
            <button
              onClick={mintTokens}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold transition duration-200"
            >
              Mint Tokens
            </button>
          </div>
        </div>
      </div>

      <footer className="text-gray-400 text-sm mt-8">
        Powered by <span className="text-indigo-400 font-semibold">Solana</span> ⚡
      </footer>
    </div>
  );
}
