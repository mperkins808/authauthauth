import { Inter } from "next/font/google";

import Head from "next/head";
import styles from "./index.module.css";
import { useState } from "react";
import axios from "axios";
import { UserButton, SignInButton, UserProfile } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { isSignedIn, user } = useUser();

  return (
    <main className={`${inter.className}`}>
      <Head>
        <title>Frontend App</title>
      </Head>
      <div className={styles.header}> Frontend </div>
      <div className={styles.body}>
        <div className={`${styles.accountContainer}`}>
          {!isSignedIn ? (
            <SignInButton mode="modal">Login</SignInButton>
          ) : (
            <div>
              <UserButton appearance={{ elements: { userButtonAvatarBox: styles.accountIcon } }} />
              <div style={{ marginTop: "20px" }}>UserID is {user.id}</div>
            </div>
          )}
        </div>
        <div className={styles.apiContainer}>
          <Healthy />
          <GetData />
        </div>
      </div>
    </main>
  );
}

function Healthy() {
  const [output, setOutput] = useState("");

  const callAPI = () => {
    console.log("Client invoking healthy endpoint");
    axios.get("/api/healthy").then((resp) => {
      setOutput(resp.data);
    });
  };

  return (
    <div className={styles.apiCaller}>
      <button onClick={callAPI}>Call Healthy Endpoint</button>

      <div> API Response: {output}</div>
    </div>
  );
}

function GetData() {
  const [output, setOutput] = useState("");
  const { isSignedIn, user } = useUser();

  const callAPI = () => {
    console.log("Client invoking data endpoint");
    if (!isSignedIn) {
      setOutput("Not signed in");
      return;
    }
    axios
      .get(`/api/data?userid=${user.id}`)
      .then((resp) => {
        setOutput(resp.data);
      })
      .catch((err) => {
        console.error(err.message);
        setOutput(err.message);
      });
  };

  return (
    <div className={styles.apiCaller}>
      <button onClick={callAPI}>Call Data Endpoint</button>

      <div> API Response: {output}</div>
    </div>
  );
}
