import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import Cookies from "cookies";
import cache from "memory-cache";
import jwt from "jsonwebtoken";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { userid } = req.query;

  if (!userid) return res.status(403).json("Forbidden");

  userid = userid as string;

  const isAuth = validClerkJWT(req, res, userid);
  if (!isAuth) return res.status(403).json({ error: "Forbidden" });

  console.log("user is authenticated so fetching token from gcp metadata server");
  const client = await customAxios();

  let data = "";
  try {
    const resp = await client.get("/");
    data = resp.data;
  } catch (error) {
    console.error(error);
    data = "Something wrong in backend";
  }

  return res.status(200).json(data);
}

function validClerkJWT(req: NextApiRequest, res: NextApiResponse, requestedUser: string | undefined) {
  const cookies = new Cookies(req, res);
  const sessToken = cookies.get("__session");
  let PEM = process.env.CLERK_PUBLIC_PEM;
  if (PEM) {
    PEM = PEM.replace(/\\n/g, "\n");
  }

  if (sessToken === undefined) {
    return false;
  }
  try {
    let decoded = "";
    decoded = jwt.verify(sessToken, PEM, { ignoreNotBefore: true });
    const isValidReq = clientCanRequest(decoded, requestedUser);
    if (!isValidReq) return false;

    return decoded;
  } catch (err: any) {
    console.error("Something wrong with jwt. ", err.message);
    return false;
  }
}

// Checks that a user to making requests for themself
function clientCanRequest(decodedSessToken, requestedUser) {
  console.log("validating user can make request");
  if (decodedSessToken.sub !== requestedUser) {
    console.warn(`${decodedSessToken.sub} requested for ${requestedUser}. 403`);
    return false;
  }
  console.log(`${decodedSessToken.sub} can make request`);
  return true;
}

export async function getGCPToken() {
  if (process.env.ENV !== "PROD") {
    console.log(`env is ${process.env.ENV} so using dummy token`);
    return "123";
  }

  const cachedToken = cache.get("jwtToken");
  if (cachedToken) {
    console.log("retrieved gcp token from cache");
    return cachedToken;
  }

  const headers = { "Metadata-Flavor": "Google" };
  const config = {
    headers,
  };
  const resp = await axios.get(`http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${process.env.BACKEND_URL}`, config);
  const token = resp.data;
  console.log("retrieving gcp access token");
  cache.put("jwtToken", token, 3000 * 1000);
  return token;
}

export async function getGCPAuth() {
  const token = await getGCPToken();
  const header = { Authorization: `Bearer ${token}` };
  return { headers: header };
}

async function customAxios() {
  const token = await getGCPToken();
  const instance = axios.create({
    baseURL: process.env.BACKEND_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
  return instance;
}
