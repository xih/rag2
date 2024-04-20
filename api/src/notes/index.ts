// what is the algorithm
// 1. first do notes
// 2. then do question and answe
// 3. what are the functions for notes that we have to write?

import axios from "axios";
import { UnstructuredLoader } from "langchain/document_loaders/fs/unstructured";
import { PDFDocument } from "pdf-lib";
import { writeFile, unlink, readFile } from "fs/promises";
import { Document } from "langchain/document";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ArxivPaperNote,
  NOTES_TOOL_SCHEMA,
  NOTE_PROMPT,
  noteOutputParser,
} from "notes/prompts.js";
import { SupabaseDatabase } from "database.js";

// 4 functions
// 1. delete pages
// 2. loadPaperFromURL
// 3. convertPDFtoDocuments
// 4. generateNotes
// 5. takeNotes

const deletePages = async (pdf: Buffer, pagesToDelete: number[]) => {
  let pageCounter = 0;
  // loop through pagesToDelete and then find the specific page to delete in pdfBuffer
  // load the pdf
  const pdfBuffer = await PDFDocument.load(pdf);
  let numToOffsetBy = 0;

  for (const pageNum of pagesToDelete) {
    pdfBuffer.removePage(pageNum - numToOffsetBy);
    numToOffsetBy += 1;
  }

  const pdfBytes = await pdfBuffer.save();
  return Buffer.from(pdfBytes);
};

const loadPaperFromUrl = async (url: string) => {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });

  return response.data;
};

const convertPDFtoDocuments = async (pdf: Buffer): Promise<Array<Document>> => {
  // first check that there is an unstructured key
  if (!process.env.UNSTRUCTURED_API_KEY) {
    throw new Error("missing UNSTRUCTURED_API_KEY key.");
    // unstructured requires a filepath to read from. If we are doing it on the edge, there's no filepath to read from
  }
  // make a random name to avoid filename collisions
  const randomName = Math.random().toString(36).substring(7);
  await writeFile(`pdfs/${randomName}.pdf`, pdf, "binary");
  // write a file with this random name and PDF
  const loader = new UnstructuredLoader(`pdfs/${randomName}.pdf`, {
    apiKey: process.env.UNSTRUCTURED_API_KEY,
    strategy: "hi_res",
    // apiUrl: "https://postcovet-ceq6kl5n.api.unstructuredapp.io", // gotta pass in the APIURL from here
    apiUrl:
      "https://postcovet-ceq6kl5n.api.unstructuredapp.io/general/v0/general", // gotta pass in the APIURL from here
    // https://stackoverflow.com/questions/77612655/what-api-key-is-required-for-unstructuredloader-in-langchains-document-loaders
    // server_url: "https://postcovet-ceq6kl5n.api.unstructuredapp.io",
  });

  const documents = await loader.load();
  await unlink(`pdfs/${randomName}.pdf`);

  console.log("wtf is going on here");

  return documents;
};

const generateNotes = (
  documents: Document[]
): Promise<Array<ArxivPaperNote>> => {
  // this generatesNotes from langchain
  // take the documents
  // use the model
  // pipe in a prompt
  // put it into an output parser

  // 1. format all the documents into a string so that openai can parse it
  const documentsAsString = formatDocumentsAsString(documents);

  // 2. create a new openAI model
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0125",
    temperature: 0.5,
  });
  // 3. bind the model with the schema (aka the prompt window)
  const modelWithTool = model.bind({
    tools: [NOTES_TOOL_SCHEMA],
  });

  // 4. create a chain by ppiping the prompt with the model with the output parser
  const chain = NOTE_PROMPT.pipe(modelWithTool).pipe(noteOutputParser);
  // 5. invoke the chain with the paper
  const response = chain.invoke({
    paper: documentsAsString,
  });
  // 6. return the response
  return response;
};

export const takeNotes = async ({
  paperUrl,
  name,
  pagesToDelete,
}: {
  paperUrl: string;
  name: string;
  pagesToDelete?: number[];
}) => {
  const pdf = "";
  // first check that the paperURL is valid
  if (!paperUrl.endsWith("pdf")) {
    throw new Error("not a pdf");
  }

  // write it into a Pdfbuffer
  let pdfBuffer = await loadPaperFromUrl(paperUrl);

  // then delete the pages
  if (pagesToDelete && pagesToDelete.length > 0) {
    pdfBuffer = await deletePages(pdfBuffer, pagesToDelete);
  }

  // convert pdf to documents
  // FOLLOWING LINES are for writting to file
  // const documents = await convertPDFtoDocuments(pdfBuffer);
  // console.log(documents, documents);
  // await writeFile("pdfs/doc1.json", JSON.stringify(documents), "utf-8");
  // console.log("written to file");

  // read in the file
  const docs = await readFile("pdfs/doc1.json", "utf-8");
  // console.log(docs, "docs");
  const documents: Document<Record<string, any>>[] = await JSON.parse(docs);

  // convert documents to notes
  const notes = await generateNotes(documents);

  // 10. create a new supabase client
  // 11. insert into it
  // 12. do this with a promise.all and generate embeddings by calling database.vectorStore.addDocuments and getting the documents from it
  //
  const database = await SupabaseDatabase.fromDocuments(documents);

  await Promise.all([
    await database.addPaper({
      paperUrl: paperUrl,
      name: name,
      paper: formatDocumentsAsString(documents),
      notes: notes,
    }),
    database.vectorStore.addDocuments(documents),
  ]);

  // do this
  return notes;
};

takeNotes({
  paperUrl: "https://arxiv.org/pdf/2404.01230.pdf",
  name: "test",
});
