// this is the question answer part of the app, and also need to build out an express server
// and database

import { ChatOpenAI } from "langchain/chat_models/openai";
import { Document } from "langchain/document";
import {
  ANSWER_QUESTION_TOOL_SCHEMA,
  QA_OVER_PAPER_PROMPT,
  answerOutputParser,
} from "./prompts.js";

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
  notes: string[]
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
const qaOnPaper = () => {
  // 1. create supabase database from existing ojbect
  // 2. similarity search the vectorstore by question and url
  // 3. get back notes from the datase
  // 4. create a new qaModel with question, douments, and notes and get back answerAndQuestions
  // 5.
};
