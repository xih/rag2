// this is the question answer part of the app, and also need to build out an express server
// and database
// 15. create a fromExistingIndex method on langchain because we don't need to create a new Database each time

import { ChatOpenAI } from "langchain/chat_models/openai";
import { Document } from "langchain/document";
import {
  ANSWER_QUESTION_TOOL_SCHEMA,
  QA_OVER_PAPER_PROMPT,
  answerOutputParser,
} from "./prompts.js";
import { SupabaseDatabase } from "database.js";
import { ArxivPaperNote } from "notes/prompts.js";

// only 2 functions
// 1. qaModel
// 2. qaOnPaper

// create a question and answer model
// takes in documents, answer, and notes
/// creates a new model
// binds the model with a tool
// creates a chain
// converts documnets to a string
// invokes modelwithTool with parameters for the note prompt
async function qaModel(
  documents: Document[],
  question: string,
  notes: Array<ArxivPaperNote>
) {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0125",
    temperature: 0.0,
  });

  const modelWithTool = model.bind({
    tools: [ANSWER_QUESTION_TOOL_SCHEMA],
    tool_choice: "auto",
  });

  const chain =
    QA_OVER_PAPER_PROMPT.pipe(modelWithTool).pipe(answerOutputParser);

  const response = chain.invoke({
    notes: notes,
    relevantDocuments: documents,
    question: question,
  });

  return response;
}

// what does this function do?
// it takes a paper URL, and returns
export const qaOnPaper = async (question: string, paperUrl: string) => {
  // 1. create supabase database from existing ojbect
  // 2. similarity search the vectorstore by question and url
  // 3. get back langchain DOCUMENTS from the database
  // 4. create a new qaModel with question, douments, and notes and get back answerAndQuestions
  // 5. get back paper from database.getPaper
  // 6. i was getting an error because I was passing a different URL than what i was training on

  const database = await SupabaseDatabase.fromExistingIndex();
  const documents = await database.vectorStore.similaritySearch(question, 8, {
    url: paperUrl,
  });

  const { notes } = await database.getPaper(paperUrl);

  const answerAndQuestions = await qaModel(
    documents,
    question,
    notes as unknown as Array<ArxivPaperNote>
  );

  return answerAndQuestions;
};
