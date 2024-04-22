// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export type QAResponse = {
  answer: string;
  followupQuestions: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QAResponse[] | undefined>
) {
  const API_URL = "http://localhost:8000/qa";
  const data = await fetch(API_URL, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: req.body,
  }).then((res) => {
    if (res.ok) {
      console.log(res, "where does this get logged?");
      return res.json();
    }
    return null;
  });
  if (data) {
    return res.status(200).json(data);
  }
  return res.status(400);
}
