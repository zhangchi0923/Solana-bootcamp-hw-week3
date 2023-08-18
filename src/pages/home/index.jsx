/* global BigInt */

import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import React, { useState } from "react";
import { enqueueSnackbar } from "notistack";

import { createMint, getAccount, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";

import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";

// import "dotenv/config.js";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;
let mint;

export default function HomePage() {
  const { publicKey } = useWallet();
  const [toPublicKey, setToPublicKey] = useState();
  const [toCount, setToCount] = useState(1);
  const { connection } = useConnection();

  // 此处需要手动导入私钥，因为spl-token库需要的参数是Signer类型
  // Signer是由publicKey和privateKey组成的，但wallet-adapter无法显式给出私钥，暂时没想出其他方法，如果直接用web3.js写指令的话，就没有这个问题了
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(
      [243,99,120,87,69,62,146,230,59,240,161,17,201,198,
        144,235,163,240,142,198,142,230,127,240,244,107,8,
        232,137,79,142,49,141,139,19,27,18,213,183,201,72,141,
        186,193,248,16,172,198,254,197,21,70,79,66,206,160,
        10,65,185,64,66,65,8,80]
  ));


  const onToPublicKey = (e) => {
    setToPublicKey(new PublicKey(e.target.value));
  };


  const onToCount = (e) => {
    setToCount(e.target.value * LAMPORTS_PER_SOL);
  };

  const onCreateToken = async () => {
    // create new token
    console.log(toPublicKey)
    enqueueSnackbar(`${publicKey} is creating token.`);
    mint = await createMint(
      connection,
      payer,
      publicKey,
      publicKey,
      9
    )
    enqueueSnackbar(`Has created token, mint address: ${mint.toBase58()}`);
    // create ata
    const ownerAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    )
    enqueueSnackbar(`Owner's ATA: ${ownerAccount.address.toBase58()}`);
    //mint 1000 token for ata
    enqueueSnackbar("Initial minting 1000 token...");
    let signature = await mintTo(
      connection,
      payer,
      mint,
      ownerAccount.address,
      publicKey,
      1000*LAMPORTS_PER_SOL
    )
    const ownerAccountInfo = await getAccount(
      connection,
      ownerAccount.address
    )
    enqueueSnackbar(`Has mint ${ownerAccountInfo.amount} Token for ${ownerAccount.address.toBase58()}`)
    enqueueSnackbar(`Signature: ${signature}.`);
  };

  const onTransfer = async () => {
    enqueueSnackbar(`Transfer to ${toPublicKey} ${toCount} Token...`);
    // get mint
    // const mint = await getMint(
    //   connection
    // )
    // get from ata
    const fromAtaAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      publicKey
    )
    // get to ata
    const toAtaAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      toPublicKey
    )
    // transfer
    const signature  = await transfer(
      connection,
      payer,
      fromAtaAccount.address,
      toAtaAccount.address,
      publicKey,
      toCount
    )
    enqueueSnackbar(`Transaction ${signature} completed.`)
  };


  return (
      <Box
        sx={{
          bgcolor: "background.paper",
          pt: 8,
          pb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
          >
            SPL Token Dashboard
          </Typography>
          <Typography
            variant="h5"
            align="center"
            color="text.secondary"
            paragraph
          >
            Create and Transfer SPL-Token in one DashBoard.
          </Typography>
    
          <Stack
            sx={{ pt: 4 }}
            direction="row"
            spacing={2}
            justifyContent="center"
          >
            <Container>
              <React.Fragment>
                <Button onClick={onCreateToken}>Create Token</Button>
              </React.Fragment>
              <React.Fragment>
                <div>
                  <TextField label="To" onChange={onToPublicKey} />
                  <TextField label="Count" onChange={onToCount} />
                  <Button onClick={onTransfer}> Transfer </Button>
                </div>
              </React.Fragment>
            </Container>
          </Stack>
        </Container>
      </Box>
  );
}
