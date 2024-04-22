// create an express server
import express from "express";
import { takeNotes } from "notes/index.js";
import { qaOnPaper } from "qa/index.js";

const processPagesToDelete = (pagesToDelete: string): number[] => {
  return pagesToDelete.split(",").map(Number);
  // return pagesToDelete.split(",").map(num => parseInt(num.trim()))
};

function main() {
  const app = express();
  const port = process.env.port || 8000;

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.status(200).send("ok");
  });

  // this takes in a paperUrl, name, and pagesToDelete
  app.post("/take_notes", async (req, res) => {
    const { paperUrl, name, pagesToDelete } = req.body;

    // convert pagesToDelete back to array of numbers
    const pagesToDeleteNum = pagesToDelete
      ? processPagesToDelete(pagesToDelete)
      : undefined;

    const notes = await takeNotes({
      paperUrl,
      name,
      pagesToDelete: pagesToDeleteNum,
    });

    res.status(200).send(notes);
    return;
  });

  app.post("/qa", async (req, res) => {
    const { question, paperUrl } = req.body;

    const answerAndQuestions = await qaOnPaper(question, paperUrl);

    res.status(200).send(answerAndQuestions);
    return;
  });

  app.listen(port, () => {
    console.log(`server is listening on http://localhost:${port}`);
  });
}

main();
